<?php

namespace App\Jobs;

use App\Events\ProjectUpdated;
use App\Models\GenerationJob;
use App\Services\AI\Contracts\LlmGeneratorService;
use App\Services\AI\BatchedGeneratorStrategy;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RunArtifactGenerationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * 30 min de orçamento — generoso pra Qwen3:8b em CPU. O queue:listen
     * já tem timeout=3600s, então cabe.
     */
    public $timeout = 1800;

    public function __construct(
        public int $generationJobId,
        public string $strategyClass
    ) {}

    public function handle(LlmGeneratorService $service): void
    {
        $job = GenerationJob::findOrFail($this->generationJobId);
        $job->update(['status' => 'running']);
        broadcast(new ProjectUpdated($job->project));

        try {
            /** @var \App\Services\AI\GeneratorStrategy $strategy */
            $strategy = new ($this->strategyClass)();
            $project = $job->project;
            $input = $job->input ?? [];

            if ($strategy instanceof BatchedGeneratorStrategy) {
                $service->runBatchedAndPersist($strategy, $project, $input);
            } else {
                $service->runAndPersist($strategy, $project, $input);
            }

            $job->update(['status' => 'completed']);
        } catch (\Throwable $e) {
            Log::error("Geração #{$job->id} ({$job->type}) falhou: {$e->getMessage()}", [
                'trace' => $e->getTraceAsString(),
            ]);
            $job->update([
                'status' => 'failed',
                'error' => $e->getMessage(),
            ]);
        }

        broadcast(new ProjectUpdated($job->fresh()->project));
    }
}
