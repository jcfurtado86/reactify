<?php

namespace App\Http\Controllers;

use App\Models\Story;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Log;

class EpicStoryGeneratorControllerGemini extends Controller
{
    public function decompose(Request $request, Story $story): JsonResponse
    {
        try {
            $validated = $request->validate([
                'project_id' => 'required|integer|exists:projects,id',
            ]);

            $prompt = $this->createPrompt($story);
            $modelName = config('gemini.model');
            $fullPrompt = 'Você é um Analista de Requisitos Sênior especialista em metodologias ágeis. ' . $prompt;
            
            $result = Gemini::generativeModel(model: $modelName)->generateContent($fullPrompt);
            $responseText = $result->text();
            $parsedData = $this->parseResponse($responseText);

            return response()->json([
                'status' => 'sucesso',
                'decomposed_stories' => $parsedData['decomposed_stories'] ?? []
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao decompor estória épica: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Erro ao processar a decomposição.'], 500);
        }
    }

    private function createPrompt(Story $epicStory): string
    {
        return <<<PROMPT
        Analise a seguinte User Story, que é considerada um "Épico" (muito grande), e a decomponha em um conjunto de User Stories menores, mais específicas e gerenciáveis.

        Estória Épica a ser decomposta: "{$epicStory->title}"

        As novas estórias devem manter o contexto da estória original, mas focar em funcionalidades ou etapas individuais.

        Formato de resposta requerido (JSON):
        {
            "decomposed_stories": [
                {
                    "title": "Título da primeira estória menor",
                    "type": "{$epicStory->type}"
                },
                {
                    "title": "Título da segunda estória menor",
                    "type": "{$epicStory->type}"
                }
            ]
        }

        Exemplo: Se a estória épica for "Como usuário, eu quero gerenciar meu perfil completo", a resposta poderia ser:
        {
            "decomposed_stories": [
                {
                    "title": "Como usuário, eu quero poder alterar meu nome e foto de perfil.",
                    "type": "user"
                },
                {
                    "title": "Como usuário, eu quero poder alterar meu e-mail e senha.",
                    "type": "user"
                },
                {
                    "title": "Como usuário, eu quero poder visualizar meu histórico de atividades.",
                    "type": "user"
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
            if (!isset($data['decomposed_stories']) || !is_array($data['decomposed_stories'])) {
                throw new \Exception("A resposta da IA não contém 'decomposed_stories'.");
            }
            return $data;
        } catch (\Exception $e) {
            Log::error("Erro no parser da resposta da IA para decomposição: " . $e->getMessage());
            throw $e;
        }
    }
}