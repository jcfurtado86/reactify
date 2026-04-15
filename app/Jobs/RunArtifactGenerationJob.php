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
use Throwable;

class RunArtifactGenerationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * ~58 min de orçamento — teto seguro abaixo do queue:work --timeout=3600.
     * Qwen3:8b em CPU leva ~5 min por item em strategies batched (com
     * 10-15 stories, facilmente passa de 30 min, por isso não cabia no
     * limite anterior de 1800s).
     */
    public $timeout = 3500;

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

    /**
     * Chamado pelo Laravel quando o job falha por QUALQUER motivo —
     * inclusive timeouts via SIGALRM, em que o try/catch do handle()
     * não executa. Garante que a GenerationJob row nunca fique órfã
     * com status="running".
     */
    public function failed(Throwable $exception): void
    {
        $job = GenerationJob::find($this->generationJobId);
        if (!$job) return;

        // Só atualiza se ainda estiver em estado intermediário —
        // preserva eventual 'completed'/'failed' já marcado pelo
        // handle() se ele chegou a rodar até o fim.
        if (in_array($job->status, ['queued', 'running'], true)) {
            $job->update([
                'status' => 'failed',
                'error' => $exception->getMessage(),
            ]);
            Log::error("Geração #{$job->id} ({$job->type}) failed() hook: {$exception->getMessage()}");
            if ($job->project) {
                broadcast(new ProjectUpdated($job->fresh()->project));
            }
        }
    }
}
