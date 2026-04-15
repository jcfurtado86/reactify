<?php

namespace App\Jobs;

use App\Models\Interview;
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

    public function handle(): void
    {

        $pythonServiceUrl = config('services.python_transcriber.url');

        try {
            $response = Http::timeout($this->timeout - 10) // Timeout da requisição um pouco menor que o do job
                ->post($pythonServiceUrl . '/transcribe', [
                    'file_url' => $this->interview->file_path,
                ]);

            if ($response->successful()) {
                $this->interview->update([
                    'transcript_raw' => $response->json('transcript_raw'),
                    'transcript' => $response->json('transcript'),
                    'transcript_summary' => null, // força resumir de novo
                    'extraction_status' => 'completed'
                ]);

                // Encadeia o resumo estruturado: as strategies de IA usam
                // transcript_summary em vez do transcript cru pra reduzir
                // o tamanho do contexto dos prompts.
                SummarizeInterviewJob::dispatch($this->interview->id);
            } else {
                throw new \Exception('Serviço de transcrição retornou um erro: ' . $response->body());
            }

        } catch (\Exception $e) {
            Log::error('Falha no job de transcrição: ' . $e->getMessage());
            $this->interview->update(['extraction_status' => 'failed']);
            broadcast(new ProjectUpdated($this->interview->project));
            $this->fail($e); // Marca o job como falho
            return;
        }

        broadcast(new ProjectUpdated($this->interview->project));
        Log::info("Job concluído para a entrevista ID: {$this->interview->id}.");
    }
}