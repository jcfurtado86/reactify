<?php

namespace App\Http\Controllers;

use App\Models\Story;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Log;

class UsageScenarioGeneratorControllerGemini extends Controller
{
    public function generate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'project_id' => 'required|exists:projects,id',
            ]);

            $stories = Story::where('project_id', $validated['project_id'])->get();

            if($stories->isEmpty()) {
                return response()->json(['status' => 'error', 'message' => 'Nenhuma Story foi encontrada no projeto para análise.'], 404);
            }

            $allUsageScenarios = [];
            $modelName = config('gemini.model');
            $fullPromptPrefix = 'Você é um especialista em engenharia de software e análise de requisitos. ';

            // Itera sobre cada estória e gera os cenários separadamente
            foreach ($stories as $story) {
                try {
                    $prompt = $this->createPrompt($story);
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

    private function createPrompt(Story $story): string
    {
        return <<<PROMPT
        Sua tarefa é criar Cenários de Uso para a Story fornecida, representando-os como Cenários de Aceitação no padrão GIVEN-WHEN-THEN. Os cenários de uso são os comportamentos que o produto possuirá a partir da interação com os usuários finais. Isso garante o refinamento das funcionalidades por meio de exemplos reais do negócio e a criação de cenários para testes de aceitação.

        Story: "- Story: {$story->title}; Tipo: {$story->title}"

        O cenário deve seguir a estrutura:
        - 'as': O papel do usuário (extraído da estória).
        - 'given': A pré-condição ou o contexto inicial.
        - 'when': A ação que o usuário realiza.
        - 'then_1': O resultado esperado principal.
        - 'and': (Opcional) Uma verificação adicional no resultado.
        - 'then_2': (Opcional) Outro resultado esperado.

        Formato de resposta requerido (JSON):
        {
            "usage_scenarios": [
                {
                    "description": {
                        "as": "O papel do usuário",
                        "given": "Dado que...",
                        "when": "Quando eu...",
                        "then_1": "Então eu deveria...",
                        "and": "E também...",
                        "then_2": "E finalmente..."
                    }
                }
            ]
        }

        Exemplo de um Cenário de Aceitação do projeto de streaming de filmes:
        Se a Story for "Eu como Leon Cardoso quero uma opção de exclusão de filmes do catálogo da plataforma no painel de controle administrativo para remover um filme do catálogo.", a resposta poderia ser:
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