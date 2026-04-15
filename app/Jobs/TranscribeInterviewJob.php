<?php

namespace App\Jobs;

use App\Models\Interview;
use App\Services\AI\TranscriptCleanupService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Events\ProjectUpdated;

class TranscribeInterviewJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    // 1h de orçamento: cobre whisper local + cleanup Qwen3:14b em CPU
    // mesmo pra entrevistas grandes (30+ min de áudio / 50+ páginas de PDF).
    public $timeout = 3600;

    protected $interview;

    public function __construct(Interview $interview)
    {
        $this->interview = $interview;
    }

    public function handle(TranscriptCleanupService $cleaner): void
    {

        $pythonServiceUrl = config('services.python_transcriber.url');

        try {
            $response = Http::timeout($this->timeout - 10)
                ->post($pythonServiceUrl . '/transcribe', [
                    'file_url' => $this->interview->file_path,
                ]);

            if (!$response->successful()) {
                throw new \Exception('Serviço de transcrição retornou um erro: ' . $response->body());
            }

            // Hoje o py_service ainda pode devolver um 'transcript' pre-processado
            // (se POSTPROCESSOR_PROVIDER != noop). Preferimos sempre o raw e
            // processamos aqui no Laravel via TranscriptCleanupService, que
            // usa o mesmo provider plugável do resto do pipeline.
            $raw = $response->json('transcript_raw') ?? $response->json('transcript') ?? '';
            $cleaned = $cleaner->cleanup($raw);

            $this->interview->update([
                'transcript_raw' => $raw,
                'transcript' => $cleaned,
                'extraction_status' => 'completed',
            ]);
        } catch (\Exception $e) {
            Log::error('Falha no job de transcrição: ' . $e->getMessage());
            $this->interview->update(['extraction_status' => 'failed']);
            broadcast(new ProjectUpdated($this->interview->project));
            $this->fail($e);
            return;
        }

        broadcast(new ProjectUpdated($this->interview->project));
        Log::info("Job concluído para a entrevista ID: {$this->interview->id}.");
    }
}