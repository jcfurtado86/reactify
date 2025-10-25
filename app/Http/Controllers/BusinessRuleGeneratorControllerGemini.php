<?php

namespace App\Http\Controllers;

use App\Models\Story;
use App\Models\BusinessRule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Log;
use App\Models\Interview;
use App\Models\Goal;

class BusinessRuleGeneratorControllerGemini extends Controller
{
    public function generate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'project_id' => 'required|exists:projects,id',
            ]);
            $projectId = $validated['project_id'];

            $stories = Story::where('project_id', $validated['project_id'])->get();
            $interviews = Interview::where('project_id', $projectId)
                ->whereNotNull('transcript')
                ->where('transcript', '!=', '')
                ->get();

            if($stories->isEmpty()) {
                return response()->json(['status' => 'warning', 'message' => 'Nenhuma estória válida foi encontrada.'], 404);
            }
            if ($interviews->isEmpty()) {
                return response()->json(['status' => 'warning', 'message' => 'Nenhuma entrevista foi encontrada para dar contexto.'], 422);
            }

            $goals = Goal::where('project_id', $projectId)->get();
            $goalsContext = "Nenhum goal definido.";
            if ($goals->isNotEmpty()) {
                $goalsContext = $goals->map(function($goal) {
                    return "- \"{$goal->title}\" (Tipo: {$goal->type})";
                })->implode("\n");
            }

            $existingRules = BusinessRule::where('project_id', $projectId)->get();
            $existingRulesByStory = $existingRules->groupBy('story_id');
            
            $combinedTranscripts = $interviews->pluck('transcript')->implode("\n\n---\n\n");

            $allBusinessRules = [];
            $modelName = config('gemini.model');
            $fullPromptPrefix = 'Você é um especialista em engenharia de software e análise de requisitos.';

            // 3. Itera sobre cada estória e gera as regras separadamente
            foreach ($stories as $story) {
                try {
                    $storyRulesContext = "Nenhuma.";
                    if (isset($existingRulesByStory[$story->id])) {
                        $storyRulesContext = $existingRulesByStory[$story->id]
                            ->map(fn($rule) => "- \"{$rule->title}\"")
                            ->implode("\n");
                    }
                    $prompt = $this->createPrompt($story, $combinedTranscripts, $goalsContext, $storyRulesContext);
                    Log::info("PROMPT PARA BUSINESS RULES: \n\n{$prompt}:");
                    $result = Gemini::generativeModel(model: $modelName)->generateContent($fullPromptPrefix . $prompt);
                    $responseText = $result->text();
                    $parsedData = $this->parseResponse($responseText);

                    $rulesWithIds = array_map(function($rule) use ($story, $validated) {
                        $rule['story_id'] = $story->id;
                        $rule['project_id'] = $validated['project_id'];
                        return $rule;
                    }, $parsedData['business_rules']);

                    $allBusinessRules = array_merge($allBusinessRules, $rulesWithIds);

                } catch (\Exception $e) {
                    Log::warning("Falha ao gerar regra de negócio para a estória ID {$story->id}: " . $e->getMessage());
                    continue;
                }
            }

            return response()->json([
                'status' => 'sucesso',
                'business_rules' => $allBusinessRules
            ]);
        } catch (\Exception $e) {
            Log::error('Erro geral ao gerar regras de negócio: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Ocorreu um erro geral no processo de geração.'], 500);
        }
    }

    private function createPrompt(Story $story, string $interviewContext, string $goalsContext, string $existingRulesContext): string
    {
        return <<<PROMPT
        Sua tarefa agora é extrair as Regras de Negócio (RNs), que são declarações que definem ou restringem alguma parte do negócio. 
        **Definição de Regra de Negócio**: Elas servem como informações que evidenciam o contexto de negócio do cliente e como ele opera em termos gerais. Elas devem ser procuradas (refinadas) através da análise de cada Story. Para estabelecer regras de negócio mais completas, você deve considerar as Goals do Projeto previamente identificadas.

        **Tarefa**: Analisar as Goals do Projeto juntamente com a Story do Projeto e as Regras de Negócios já existentes para aquela Story e completar a lista de Regras de Negócios com novas regras que possam contribuir para essa fase do projeto. 

        **Story do Projeto para Análise:**
        "Tipo: {$story->type} story"
        "Descrição: {$story->title}"
        
        **Contexto das entrevistas de requisitos do Projeto (Use como base de conhecimento):**
        {$interviewContext}
        
        **Fim do contexto da entrevista**

        **Contexto de Goals do Projeto:**
        {$goalsContext}
        
        **Regras de negócios do Projeto já existentes**
        {$existingRulesContext}
        
        Formato de resposta requerido (JSON):
        {
            "business_rules": [
                { "title": "Título da primeira regra de negócio." },
                { "title": "Título da segunda regra de negócio." }
            ]
        }
        **Fim do formato requerido**

        Exemplos aplicado a um projeto de streaming de filmes:
        Se a Story for "Eu como Administrador quero uma seção no painel de controle administrativo que exibe 
        estatísticas, gráficos ou tabelas de visitas à plataforma para consultar o fluxo de visitas à plataforma.", 
        a resposta poderia ser:
        {
            "business_rules": [
                { "title": "A seção de estatísticas, gráficos ou tabelas de vistas deve estar disponível apenas no painel de controle administrativo, garantindo que apenas usuários autorizados, como administradores, tenham acesso a essas informações." },
                { "title": "As informações de visitas à plataforma devem ser protegidas e acessíveis apenas para usuários autorizados. É necessário garantir que os dados dos usuários sejam tratados de acordo com as leis de privacidade de dados aplicáveis e as políticas de segurança da empresa." },
                { "title": "As estatísticas, gráficos ou tabelas devem ser apresentados de forma clara e compreensível para os administradores." }
            ]
        }
        **Fim do exemplo**

        IMPORTANTE: Não gere novas regras que contenham o mesmo conteúdo das regras já existestes em nenhum grau.
        IMPORTANTE: Se nenhuma nova regra for pensada, retorne um array "business_rules" vazio.
        IMPORTANTE: Retorne apenas o JSON.
        IMPORTANTE: Não gere novas regras que completam as existentes.
        PROMPT;
    }

    private function parseResponse(string $content): array
    {
        try {
            $cleanedContent = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $content);
            $data = json_decode(trim($cleanedContent), true, 512, JSON_THROW_ON_ERROR);
            if (!isset($data['business_rules']) || !is_array($data['business_rules'])) {
                throw new \Exception("A resposta da IA não contém 'business_rules'.");
            }
            return $data;
        } catch (\Exception $e) {
            Log::error("Erro no parser da IA para Regras de Negócio: " . $e->getMessage());
            throw $e;
        }
    }
}