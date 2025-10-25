<?php

namespace App\Http\Controllers;

use App\Models\Story;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Log;
use App\Models\Interview;
use App\Models\UsageScenario;

class UsageScenarioGeneratorControllerGemini extends Controller
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
                return response()->json(['status' => 'warning', 'message' => 'Nenhuma Story foi encontrada no projeto para análise.'], 404);
            }
            if ($interviews->isEmpty()) {
                return response()->json(['status' => 'warning', 'message' => 'Nenhuma entrevista foi encontrada para dar contexto.'], 422);
            }
            
            $combinedTranscripts = $interviews->pluck('transcript')->implode("\n\n---\n\n");
            
            $existingScenarios = UsageScenario::where('project_id', $projectId)->get();
            $existingScenariosByStory = $existingScenarios->groupBy('story_id');
            
            $allUsageScenarios = [];;
            $modelName = config('gemini.model');
            $fullPromptPrefix = 'Você é um especialista em engenharia de software e análise de requisitos. ';

            foreach ($stories as $story) {
                try {
                    $storyScenariosContext = "Nenhum.";
                    if (isset($existingScenariosByStory[$story->id])) {
                        $storyScenariosContext = $existingScenariosByStory[$story->id]
                            ->map(function($scenario) {
                                $desc = $scenario->description;
                                if (!is_array($desc)) {
                                    $desc = json_decode(strval($desc), true) ?? [];
                                }

                                $scenarioString = "- Cenário:\n";
                                
                                // Mapeia as chaves para texto legível
                                $keyMap = [
                                    'as' => 'COMO',
                                    'given' => 'DADO QUE',
                                    'when' => 'QUANDO',
                                ];

                                foreach ($desc as $key => $value) {
                                    if (isset($keyMap[$key])) {
                                        $scenarioString .= "    - " . $keyMap[$key] . ": " . $value . "\n";
                                    } elseif (str_starts_with($key, 'then')) {
                                        $scenarioString .= "    - ENTÃO: " . $value . "\n";
                                    } elseif (str_starts_with($key, 'and')) {
                                        $scenarioString .= "    - E: " . $value . "\n";
                                    }
                                }
                                return $scenarioString;

                            })
                            ->implode("\n\n");
                    }

                    $prompt = $this->createPrompt($story, $combinedTranscripts, $storyScenariosContext);
                    Log::info("PROMPT PARA USAGE SCENARIOS: \n\n{$prompt}:");
                    $result = Gemini::generativeModel(model: $modelName)->generateContent($fullPromptPrefix . $prompt);
                    $responseText = $result->text();
                    $parsedData = $this->parseResponse($responseText);
                    
                    $scenariosWithIds = array_map(function($scenario) use ($story, $validated) {
                        $scenario['story_id'] = $story->id;
                        $scenario['project_id'] = $validated['project_id']; 
                        return $scenario;
                    }, $parsedData['usage_scenarios']);

                    $allUsageScenarios = array_merge($allUsageScenarios, $scenariosWithIds);

                } catch (\Exception $e) {
                    Log::warning("Falha ao gerar cenário de uso para a estória ID {$story->id}: " . $e->getMessage());
                    continue;
                }
            }

            return response()->json([
                'status' => 'sucesso',
                'usage_scenarios' => $allUsageScenarios
            ]);
        } catch (\Exception $e) {
            Log::error('Erro geral ao gerar cenários de uso: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Ocorreu um erro geral no processo de geração.'], 500);
        }
    }

    private function createPrompt(Story $story, string $interviewContext, string $existingScenariosContext): string
    {
        return <<<PROMPT
        Sua tarefa é criar Cenários de Uso para a Story fornecida, representando-os como Cenários de Aceitação no padrão GIVEN-WHEN-THEN. Os cenários de uso são os comportamentos que o produto possuirá a partir da interação com os usuários finais. Isso garante o refinamento das funcionalidades por meio de exemplos reais do negócio e a criação de cenários para testes de aceitação.

        STORY (Foco principal):
        "Tipo: {$story->type} story"
        "Descrição: {$story->title}"

        Contexto das entrevistas de requisitos do Projeto (Use como base de conhecimento):
        {$interviewContext}\
        **Fim do contexto da entrevista**   

        **Fim do contexto da entrevista** 
        
        CENÁRIOS JÁ EXISTENTES PARA ESTA STORY:
        {$existingScenariosContext}

        O **NOVO** cenário deve seguir a estrutura:
        - 'as': O papel do usuário (extraído da estória).
        - 'given': A pré-condição ou o contexto inicial.
        - 'when': A ação que o usuário realiza.
        - 'then_1': O resultado esperado principal.
        - 'and': (Opcional, existe junto de then_2) Uma verificação adicional no resultado.
        - 'then_2': (Opcional, existe junto de and) Outro resultado esperado.
        - outros and/then quando necessários

        REGRA: Um 'and' em hipótese alguma deve existir sem um 'then' logo apos ele. Essa é sua principal regra e nunca deve ser quebrada.

        Formato de resposta requerido (JSON):
        {
            "usage_scenarios": [
                {
                    "description": {
                        "as": "O papel do usuário",
                        "given": "Dado que...",
                        "when": "Quando eu...",
                        "then_1": "Então eu deveria..."
                    }
                }
            ]
        }
        **Fim do formato requerido**

        Exemplos de um Cenários de Aceitaçãos do projeto de streaming de filmes:
        Se a Story for "Eu como usuário adminsitrador quero uma opção de exclusão de filmes do catálogo da plataforma no painel de controle administrativo para remover um filme do catálogo.", a resposta poderia ser:
        {
            "usage_scenarios": [
                {
                    "description": {
                        "as": "Administrador",
                        "given": "que o Administrador está autenticado no painel de controle administrativo da plataforma.",
                        "when": "o Administrador seleciona a opção de exclusão para um filme do catálogo.",
                        "then_1": "o sistema exibe uma mensagem de confirmação solicitando a confirmação da exclusão.",
                        "and": "o Administrador Cardoso confirma a exclusão.",
                        "then_2": "uma mensagem é exibida indicando que o filme foi removido com sucesso."
                    }
                }
            ]
        }

        Se a Story for "Como usuário, eu quero ter uma opção de seleção de idioma de legenda dentro do player de vídeo, para atingir o objetivo de escolher o idioma da legenda do filme que assistir", a resposta poderia ser:
        {
            "usage_scenarios": [
                {
                    "description": {
                        "as": "Usuário",
                        "given": "que usuário possui um cadastro ativo, está logado na plataforma e um filme está sendo reproduzido.",
                        "when": "o usuário acessa as configurações do player de vídeo e seleciona a opção de idioma "Português" para as legendas.",
                        "then_1": "o sistema exibe imediatamente as legendas do filme no idioma Português, permitindo que o usuário assista ao filme conforme sua preferência de idioma"
                    }
                }
            ]
        }

        Se a Story for "É necessário garantir que as informações de cadastro e login do usuário sejam armazenadas com segurança, por meio da implementação de criptografia de dados em trânsito e em repouso, para cumprir as restrições de segurança da informação e de proteção de dados pessoais", a resposta poderia ser:
        {
            "usage_scenarios": [
                {
                    "description": {
                        "given": "que um novo usuário realiza o cadastro na plataforma, inserindo seu e-mail e senha.",
                        "when": "o sistema processa a informação de senha para armazenamento no banco de dados.",
                        "then_1": "o sistema armazena a senha do usuário utilizando uma função hash criptográfica robusta para proteger os dados do usuário e aderir aos padrões legais."
                    }
                }
            ]
        }
        **Fim do exemplo**

        IMPORTANTE: Gere apenas cenários que AINDA NÃO EXISTEM na lista fornecida. 
        IMPORTANTE: Se nenhum novo cenário for encontrado, retorne um array "usage_scenarios" vazio.
        IMPORTANTE: Retorne apenas o JSON.
        PROMPT;
    }

    private function parseResponse(string $content): array
    {
        try {
            $cleanedContent = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $content);
            $data = json_decode(trim($cleanedContent), true, 512, JSON_THROW_ON_ERROR);
            if (!isset($data['usage_scenarios']) || !is_array($data['usage_scenarios'])) {
                throw new \Exception("A resposta da IA não contém 'usage_scenarios'.");
            }
            return $data;
        } catch (\Exception $e) {
            Log::error("Erro no parser da IA para Cenários de Uso: " . $e->getMessage());
            throw $e;
        }
    }
}