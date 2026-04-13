<?php

namespace App\Services\AI;

use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Gemini\Laravel\Facades\Gemini;

/**
 * Orquestra o fluxo comum a todos os geradores de artefato via Gemini:
 *
 *  1. Valida o request (project_id obrigatório + regras específicas da strategy).
 *  2. Resolve o Project.
 *  3. Confere pré-requisitos via strategy; se faltar algo, responde 422.
 *  4. Monta contexto + prompt via strategy.
 *  5. Chama o Gemini.
 *  6. Parseia a resposta via strategy.
 *  7. Delega pós-processamento opcional (ex: injetar project_id nas stories).
 *  8. Retorna JSON padronizado.
 *
 * Cada controller fica reduzido a passar a strategy certa.
 */
class GeminiGeneratorService
{
    private const SYSTEM_PREFIX =
        'Você é um especialista em engenharia de software e análise de requisitos. ';

    /**
     * Garante que o input do request já esteja validado. Aceita tanto
     * um FormRequest (já validado pelo framework) quanto um Request cru
     * (o service valida inline usando as regras da strategy). Retorna
     * o array validado ou uma JsonResponse de erro 422.
     *
     * @param GeneratorStrategy|BatchedGeneratorStrategy $strategy
     * @return array|JsonResponse
     */
    private function resolveValidatedInput($strategy, Request $request)
    {
        if ($request instanceof \App\Http\Requests\GenerateArtifactRequest) {
            return $request->validated();
        }

        $rules = array_merge(
            ['project_id' => 'required|integer|exists:projects,id'],
            $strategy->validationRules()
        );

        try {
            return $request->validate($rules);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Dados inválidos para gerar ' . $strategy->label() . '.',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function generate(GeneratorStrategy $strategy, Request $request): JsonResponse
    {
        $validated = $this->resolveValidatedInput($strategy, $request);
        if ($validated instanceof JsonResponse) {
            return $validated;
        }

        $project = Project::find($validated['project_id']);
        if (!$project) {
            return response()->json([
                'status' => 'error',
                'message' => 'Projeto não encontrado.',
            ], 404);
        }

        $missing = $strategy->missingPrerequisites($project, $validated);
        if (!empty($missing)) {
            return response()->json([
                'status' => 'warning',
                'message' => 'Para gerar ' . $strategy->label()
                    . ', é necessário cadastrar ao menos um de cada item a seguir: '
                    . implode(', ', $missing) . '.',
                'itens_faltantes' => $missing,
            ], 422);
        }

        try {
            $context = $strategy->buildContext($project, $validated);
            $prompt = $strategy->buildPrompt($context);
            $fullPrompt = self::SYSTEM_PREFIX . $prompt;

            Log::info(sprintf('PROMPT PARA %s:', strtoupper($strategy->label())), [
                'project_id' => $project->id,
                'prompt' => $fullPrompt,
            ]);

            $modelName = config('gemini.model');
            $result = Gemini::generativeModel(model: $modelName)->generateContent($fullPrompt);
            $responseText = $result->text();

            $parsed = $strategy->parseResponse($responseText);
            $parsed = $strategy->postProcess($parsed, $project, $validated);

            $body = ['status' => 'sucesso'];
            foreach ($strategy->responseKeys() as $key) {
                $body[$key] = $parsed[$key] ?? [];
            }

            return response()->json($body);
        } catch (\Exception $e) {
            Log::error(sprintf(
                'Erro ao gerar %s: %s',
                $strategy->label(),
                $e->getMessage()
            ), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'status' => 'error',
                'message' => 'Erro ao gerar ' . $strategy->label() . ': ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Variante batched: itera sobre um conjunto de itens (stories/personas)
     * chamando o Gemini uma vez por item e agregando o resultado.
     */
    public function generateBatched(BatchedGeneratorStrategy $strategy, Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $this->resolveValidatedInput($strategy, $request);
        if ($validated instanceof JsonResponse) {
            return $validated;
        }

        $project = \App\Models\Project::find($validated['project_id']);
        if (!$project) {
            return response()->json(['status' => 'error', 'message' => 'Projeto não encontrado.'], 404);
        }

        $missing = $strategy->missingPrerequisites($project, $validated);
        if (!empty($missing)) {
            return response()->json([
                'status' => 'warning',
                'message' => 'Para gerar ' . $strategy->label()
                    . ', é necessário cadastrar ao menos um de cada item a seguir: '
                    . implode(', ', $missing) . '.',
                'itens_faltantes' => $missing,
            ], 422);
        }

        try {
            $sharedContext = $strategy->sharedContext($project, $validated);
            $items = $strategy->items($project, $validated);
            $aggregated = [];
            $modelName = config('gemini.model');

            foreach ($items as $item) {
                try {
                    $prompt = self::SYSTEM_PREFIX
                        . $strategy->buildPromptForItem($item, $sharedContext, $project);

                    Log::info(sprintf('PROMPT BATCHED PARA %s:', strtoupper($strategy->label())), [
                        'project_id' => $project->id,
                        'prompt' => $prompt,
                    ]);

                    $result = Gemini::generativeModel(model: $modelName)
                        ->generateContent($prompt);
                    $parsed = $strategy->parseResponse($result->text());

                    $generatedList = $parsed[$strategy->itemResponseKey()] ?? [];
                    foreach ($generatedList as $generated) {
                        $aggregated[] = $strategy->enrichGeneratedItem(
                            $generated,
                            $item,
                            $project,
                            $validated
                        );
                    }
                } catch (\Exception $inner) {
                    Log::warning(sprintf(
                        'Falha em item do batch de %s: %s',
                        $strategy->label(),
                        $inner->getMessage()
                    ));
                    continue;
                }
            }

            return response()->json([
                'status' => 'sucesso',
                $strategy->aggregateResponseKey() => $aggregated,
            ]);
        } catch (\Exception $e) {
            Log::error(sprintf(
                'Erro no batch de %s: %s',
                $strategy->label(),
                $e->getMessage()
            ), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'status' => 'error',
                'message' => 'Erro ao gerar ' . $strategy->label() . ': ' . $e->getMessage(),
            ], 500);
        }
    }
}
