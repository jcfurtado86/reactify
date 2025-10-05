<?php

namespace App\Http\Controllers;

use App\Models\Story;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Log;

class EpicStoryGeneratorControllerGemini extends Controller
{
    /**
     * Identifica e decompõe estórias épicas de um projeto inteiro.
     */
    public function generate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'project_id' => 'required|integer|exists:projects,id',
            ]);

            $stories = Story::where('project_id', $validated['project_id'])->get();

            if ($stories->isEmpty()) {
                return response()->json([
                    'status' => 'warning',
                    'message' => 'Nenhuma Story foi encontrada no projeto para analisar.'
                ], 422);
            }

            $prompt = $this->createPrompt($stories);
            $modelName = config('gemini.model');
            $fullPrompt = 'Você é um especialista em engenharia de software e análise de requisitos. ' . $prompt;
            
            $result = Gemini::generativeModel(model: $modelName)->generateContent($fullPrompt);
            $responseText = $result->text();
            $parsedData = $this->parseResponse($responseText);

            return response()->json([
                'status' => 'sucesso',
                'decomposed_epics' => $parsedData['decomposed_epics'] ?? []
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao identificar e decompor estórias épicas: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Erro ao processar a decomposição.'], 500);
        }
    }

    private function createPrompt(\Illuminate\Database\Eloquent\Collection $stories): string
    {
        $storyContext = $stories->map(function ($story) {
            return "- ID {$story->id}; \"{$story->title}\"; \"{$story->type}\"";
        })->implode("\n");

        return <<<PROMPT
        Sua primeira e mais importante tarefa é analisar CUIDADOSAMENTE cada User Story para determinar se ela é, de fato, um "Épico". Um épico é uma estória que é claramente grande demais, que abrange múltiplas funcionalidades distintas ou que não poderia ser concluída em um único ciclo de desenvolvimento (sprint).

        REGRA: Se uma estória descreve uma única ação ou um fluxo contínuo e coeso, ela NÃO é um épico e NÃO deve ser decomposta. Apenas depois de justificar internamente que uma estória é um épico, você deve prosseguir para a sua decomposição.

        Lista de Stories para Análise:
        {$storyContext}

        O formato de resposta requerido é um JSON contendo os épicos identificados e suas respectivas estórias decompostas.

        Formato de resposta requerido (JSON):
        {
            "decomposed_epics": [
                {
                    "original_epic_id": <ID da estória original>,
                    "original_epic_title": "Título da estória original",
                    "new_stories": [
                        { "title": "Título da primeira estória menor", "type": "user" },
                        { "title": "Título da segunda estória menor", "type": "user" }
                    ]
                }
            ]
        }

        Exemplo: Se a lista contiver a estória "ID 10: Eu como Leon Cardoso quero uma seção no painel de controle administrativo que exibe estatísticas, gráficos ou tabelas de visitas à plataforma para consultar o fluxo de visitas à plataforma.", a resposta poderia ser:
        {
            "decomposed_epics": [
                {
                    "original_epic_id": 10,
                    "original_epic_title": "Eu como Leon Cardoso quero uma seção no painel de controle administrativo que exibe estatísticas, gráficos ou tabelas de visitas à plataforma para consultar o fluxo de visitas à plataforma.",
                    "new_stories": [
                        { "title": "Eu como Leon Cardoso quero uma seção no painel de controle administrativo que gere gráficos ou tabelas com os dados do fluxo de visitas à plataforma para consultar o fluxo de visitas à plataforma.", "type": "user" },
                        { "title": "Eu como Leon Cardoso quero uma seção no painel de controle administrativo que exibe o número de acessos totais e uma média aritmética de acessos diários para consultar o fluxo de visitas à plataforma.", "type": "user" }
                    ]
                }
            ]
        }

        Se nenhuma estória for considerada um épico, retorne um array "decomposed_epics" vazio.
        IMPORTANTE: As novas estórias decompostas devem obrigatoriamente manter o mesmo 'type' ('user' ou 'system') da estória épica original da qual elas se originaram.
        IMPORTANTE: Retorne apenas o JSON.
        PROMPT;
    }

    private function parseResponse(string $content): array
    {
        try {
            $cleanedContent = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $content);
            $data = json_decode(trim($cleanedContent), true, 512, JSON_THROW_ON_ERROR);
            if (!isset($data['decomposed_epics']) || !is_array($data['decomposed_epics'])) {
                throw new \Exception("A resposta da IA não contém 'decomposed_epics'.");
            }
            return $data;
        } catch (\Exception $e) {
            Log::error("Erro no parser da resposta da IA para decomposição: " . $e->getMessage());
            throw $e;
        }
    }
}