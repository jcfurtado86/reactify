<?php

namespace App\Services\AI\Generators;

use App\Models\Project;
use App\Services\AI\BatchedGeneratorStrategy;
use App\Services\AI\Contracts\LlmGeneratorService;
use App\Services\AI\GeneratorStrategy;
use Illuminate\Support\Facades\Log;

/**
 * Orquestra o fluxo comum a todas as gerações de artefato:
 *
 *  1. buildContext(project, input) via strategy
 *  2. buildPrompt(context) via strategy
 *  3. callLlm(prompt) — único método abstrato, implementado por cada provider
 *  4. parseResponse(rawText) via strategy
 *  5. postProcess(parsed) via strategy
 *  6. persistGenerated(parsed, project, input) via strategy → grava no banco
 *     com is_ai_generated=true
 *
 * O método `runAndPersist` é o entrypoint chamado pelo
 * RunArtifactGenerationJob. Não devolve nada — o efeito colateral é a
 * persistência. Erros são propagados (o job lida com eles e marca
 * generation_jobs.status=failed).
 */
abstract class AbstractLlmGeneratorService implements LlmGeneratorService
{
    protected const SYSTEM_PREFIX =
        'Você é um especialista em engenharia de software e análise de requisitos. ';

    /**
     * Cada provider implementa só este método. Recebe o prompt completo
     * (já com o SYSTEM_PREFIX + prompt da strategy), devolve o texto cru
     * do modelo. Pode lançar exceção se a chamada ao LLM falhar.
     */
    abstract protected function callLlm(string $prompt): string;

    public function runAndPersist(GeneratorStrategy $strategy, Project $project, array $input): void
    {
        $context = $strategy->buildContext($project, $input);
        $prompt = $strategy->buildPrompt($context);
        $fullPrompt = self::SYSTEM_PREFIX . $prompt;

        Log::info(sprintf('PROMPT PARA %s:', strtoupper($strategy->label())), [
            'project_id' => $project->id,
            'prompt' => $fullPrompt,
        ]);

        $responseText = $this->callLlm($fullPrompt);

        $parsed = $strategy->parseResponse($responseText);
        $parsed = $strategy->postProcess($parsed, $project, $input);

        $strategy->persistGenerated($parsed, $project, $input);
    }

    public function runBatchedAndPersist(BatchedGeneratorStrategy $strategy, Project $project, array $input): void
    {
        $sharedContext = $strategy->sharedContext($project, $input);
        $items = $strategy->items($project, $input);
        $aggregated = [];

        foreach ($items as $item) {
            try {
                $prompt = self::SYSTEM_PREFIX
                    . $strategy->buildPromptForItem($item, $sharedContext, $project);

                Log::info(sprintf('PROMPT BATCHED PARA %s:', strtoupper($strategy->label())), [
                    'project_id' => $project->id,
                    'prompt' => $prompt,
                ]);

                $responseText = $this->callLlm($prompt);
                $parsed = $strategy->parseResponse($responseText);

                $generatedList = $parsed[$strategy->itemResponseKey()] ?? [];
                foreach ($generatedList as $generated) {
                    $aggregated[] = $strategy->enrichGeneratedItem(
                        $generated,
                        $item,
                        $project,
                        $input
                    );
                }
            } catch (\Throwable $inner) {
                Log::warning(sprintf(
                    'Falha em item do batch de %s: %s',
                    $strategy->label(),
                    $inner->getMessage()
                ));
                continue;
            }
        }

        // Persiste o resultado agregado num único shape que a strategy
        // sabe consumir. Convenção: a strategy expõe aggregateResponseKey()
        // (já existente no contrato batched) e persistGenerated trata o
        // formato `[key => aggregated]`.
        $strategy->persistGenerated(
            [$strategy->aggregateResponseKey() => $aggregated],
            $project,
            $input
        );
    }
}
