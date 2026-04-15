<?php

namespace App\Services\AI\Contracts;

use App\Models\Project;
use App\Services\AI\BatchedGeneratorStrategy;
use App\Services\AI\GeneratorStrategy;

/**
 * Contrato pra serviços que geram artefatos via LLM. Implementações
 * concretas (Ollama, Gemini, etc) ficam em app/Services/AI/Generators/.
 *
 * O método `runAndPersist` é invocado pelo RunArtifactGenerationJob:
 * ele orquestra buildContext → buildPrompt → callLlm → parseResponse →
 * postProcess → strategy->persistGenerated(). Sem retorno HTTP — o
 * efeito colateral é a persistência das rows com is_ai_generated=true.
 */
interface LlmGeneratorService
{
    public function runAndPersist(GeneratorStrategy $strategy, Project $project, array $input): void;

    public function runBatchedAndPersist(BatchedGeneratorStrategy $strategy, Project $project, array $input): void;

    /**
     * Passthrough pra chamar o LLM com um prompt cru. Não envolve strategy,
     * não persiste nada — devolve só o texto bruto. Usado pelo
     * SummarizeInterviewJob e outros casos fora do pipeline de artefatos.
     */
    public function runRawPrompt(string $prompt, ?array $schema = null): string;
}
