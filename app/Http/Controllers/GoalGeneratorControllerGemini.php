<?php

namespace App\Http\Controllers;

use App\Models\Interview;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class GoalGeneratorControllerGemini extends Controller
{
    /**
     * Gera Goals (Business e Constraint) com base em uma transcrição de entrevista.
     */
    public function generateGoals(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'project_id' => 'required|integer|exists:projects,id',
            ]);

            $interviews = Interview::where('project_id', $validated['project_id'])
                ->whereNotNull('transcript')
                ->where('transcript', '!=', '')
                ->latest()
                //->limit(5)    // Limita a 5
                ->get();

            if ($interviews->isEmpty()) {
                return response()->json([
                    'status' => 'warning',
                    'message' => 'Nenhuma entrevista com transcrição foi encontrada neste projeto para análise.'
                ], 422);
            }

            $combinedTranscripts = $interviews->pluck('transcript')->implode("\n\n---\n\n");

            $prompt = $this->createPrompt($combinedTranscripts);
            $modelName = config('gemini.model');
            $fullPrompt = 'Você é um especialista em Análise de Requisitos e Product Management. ' . $prompt;
            $result = Gemini::generativeModel(model: $modelName)->generateContent($fullPrompt);
            $responseText = $result->text();

            $parsedData = $this->parseResponse($responseText);
            return response()->json([
                'status' => 'sucesso',
                'project_id' => $validated['project_id'],
                'goals' => $parsedData['goals'] ?? []
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['status' => 'error', 'message' => 'Dados inválidos.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Erro ao gerar goals a partir da entrevista: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Ocorreu um erro no servidor ao gerar os goals.'], 500);
        }
    }

    /**
     * Cria o prompt para extrair Goals de uma transcrição.
     */
    private function createPrompt(string $transcript): string
    {
        return <<<PROMPT
        Analise a transcrição da entrevista abaixo e extraia os objetivos de negócio (Business Goals) e as restrições (Constraint Goals).

        Transcrição: "{$transcript}"

        Sua tarefa é identificar:
        1.  **Business Goals (type: "bg")**: Objetivos principais que o negócio ou o usuário quer alcançar. O que gera valor? Ex: "Aumentar o engajamento", "Facilitar a busca por filmes".
        2.  **Constraint Goals (type: "cg")**: Restrições, qualidades ou requisitos não-funcionais que o sistema deve ter. Ex: "A plataforma deve ser segura", "O carregamento precisa ser rápido", "Deve funcionar em celulares".

        Para cada goal identificado, atribua uma prioridade ('high', 'medium', 'low') com base na ênfase dada pelo entrevistado.

        Formato de resposta requerido (JSON):
        {
            "goals": [
                {
                    "title": "Texto do goal extraído da entrevista",
                    "type": "bg" | "cg",
                    "priority": "high" | "medium" | "low"
                }
            ]
        }

        Exemplo de resposta:
        {
            "goals": [
                {
                    "title": "Permitir que os usuários criem playlists de filmes para organizar o que querem assistir.",
                    "type": "bg",
                    "priority": "high"
                },
                {
                    "title": "Garantir que a plataforma não tenha anúncios intrusivos que atrapalhem a experiência.",
                    "type": "cg",
                    "priority": "medium"
                },
                {
                    "title": "O sistema deve carregar um filme em menos de 3 segundos.",
                    "type": "cg",
                    "priority": "high"
                }
            ]
        }

        IMPORTANTE: Baseie-se **exclusivamente** no conteúdo da transcrição. Retorne apenas o JSON.
        PROMPT;
    }

    /**
     * Analisa e valida a resposta JSON da API Gemini.
     */
    private function parseResponse(string $content): array
    {
        try {
            $cleanedContent = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $content);
            $cleanedContent = trim($cleanedContent);
            $data = json_decode($cleanedContent, true, 512, JSON_THROW_ON_ERROR);

            if (!isset($data['goals']) || !is_array($data['goals'])) {
                throw new \Exception("A resposta da IA não contém um array 'goals' válido.");
            }
            return $data;
        } catch (\Exception $e) {
            Log::error("Erro no parser da resposta da IA para Goals: " . $e->getMessage());
            throw $e;
        }
    }
}