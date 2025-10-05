<?php

namespace App\Http\Controllers;

use App\Models\Story;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Log;

class BusinessRuleGeneratorControllerGemini extends Controller
{
    public function generate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'project_id' => 'required|exists:projects,id',
            ]);

            $stories = Story::where('project_id', $validated['project_id'])->get();

            if($stories->isEmpty()) {
                return response()->json(['status' => 'error', 'message' => 'Nenhuma estória válida foi encontrada.'], 404);
            }

            $allBusinessRules = [];
            $modelName = config('gemini.model');
            $fullPromptPrefix = 'Você é um especialista em engenharia de software e análise de requisitos.';

            // 3. Itera sobre cada estória e gera as regras separadamente
            foreach ($stories as $story) {
                try {
                    $prompt = $this->createPrompt($story);
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

    private function createPrompt(Story $story): string
    {
        return <<<PROMPT
        Sua tarefa é extrair as Regras de Negócio (Business Rules) que estão implícitas ou são necessárias para que as funcionalidades descritas nas Stories abaixo existam.

        **Definição de Regra de Negócio**: As regras de negócio são informações que evidenciam o contexto de negócio do cliente e como ele opera. Em termos gerais, as regras de negócio são declarações que definem ou restringem alguma parte do negócio e refletem políticas, procedimentos e práticas do negócio do cliente.

        Stories para Análise:
        "{$story->title}"

        Formato de resposta requerido (JSON):
        {
            "business_rules": [
                { "title": "Título da primeira regra de negócio." },
                { "title": "Título da segunda regra de negócio." }
            ]
        }

        Exemplo aplicado a um projeto de streaming de filmes:
        Se a Story for "Eu como Leon Cardoso quero uma seção no painel de controle administrativo que exibe estatísticas, gráficos ou tabelas de visitas à plataforma para consultar o fluxo de visitas à plataforma.", a resposta poderia ser:
        {
            "business_rules": [
                { "title": "A seção de estatísticas, gráficos ou tabelas de vistas deve estar disponível apenas no painel de controle administrativo, garantindo que apenas usuários autorizados, como administradores, tenham acesso a essas informações." },
                { "title": "As informações de visitas à plataforma devem ser protegidas e acessíveis apenas para usuários autorizados. É necessário garantir que os dados dos usuários sejam tratados de acordo com as leis de privacidade de dados aplicáveis e as políticas de segurança da empresa." },
                { "title": "As estatísticas, gráficos ou tabelas devem ser apresentados de forma clara e compreensível para os administradores." }
            ]
        }

        IMPORTANTE: Analise todas as estórias fornecidas para extrair as regras. Retorne apenas o JSON.
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