<?php

namespace App\Http\Controllers;

use App\Models\Story;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Log;

class UsageScenarioGeneratorControllerGemini extends Controller
{
    public function generate(Request $request, Story $story): JsonResponse
    {
        try {
            $validated = $request->validate([ 'project_id' => 'required|exists:projects,id' ]);

            $prompt = $this->createPrompt($story);
            $modelName = config('gemini.model');
            $fullPrompt = 'Você é um Engenheiro de QA Sênior especialista em BDD e Gherkin. ' . $prompt;
            
            $result = Gemini::generativeModel(model: $modelName)->generateContent($fullPrompt);
            $responseText = $result->text();
            $parsedData = $this->parseResponse($responseText);

            return response()->json([
                'status' => 'sucesso',
                'usage_scenarios' => $parsedData['usage_scenarios'] ?? []
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao gerar cenários de uso: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Erro ao processar a geração.'], 500);
        }
    }

    private function createPrompt(Story $story): string
    {
        // Extrai o papel da persona da estória, se existir.
        preg_match('/Como (.*?),/', $story->title, $matches);
        $as = $matches[1] ?? 'usuário';

        return <<<PROMPT
        Analise a User Story a seguir e crie um Cenário de Uso (Usage Scenario) detalhado usando o formato Gherkin.

        User Story: "{$story->title}"

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
                        "as": "{$as}",
                        "given": "Dado que...",
                        "when": "Quando eu...",
                        "then_1": "Então eu deveria...",
                        "and": "E também...",
                        "then_2": "E finalmente..."
                    }
                }
            ]
        }

        Exemplo: Se a User Story for "Como cliente, eu quero adicionar um item ao meu carrinho de compras."
        {
            "usage_scenarios": [
                {
                    "description": {
                        "as": "cliente",
                        "given": "Dado que estou na página de detalhes de um produto",
                        "when": "Quando eu clico no botão 'Adicionar ao Carrinho'",
                        "then_1": "Então o item deve ser adicionado ao meu carrinho",
                        "and": "E o número de itens no ícone do carrinho deve ser atualizado",
                        "then_2": null
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