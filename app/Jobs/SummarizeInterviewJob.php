<?php

namespace App\Jobs;

use App\Models\Interview;
use App\Services\AI\Contracts\LlmGeneratorService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Pré-processa a transcrição de uma entrevista num resumo estruturado
 * denso (~1500 chars, 7 seções markdown) e cacheia na coluna
 * `interviews.transcript_summary`.
 *
 * O resumo é usado pelas 10 strategies de IA no lugar do transcript
 * cru, reduzindo em ~80% o tamanho do contexto injetado nos prompts.
 * Resolve o problema de Persona/Story/OverallModel que quebravam sob
 * `format: json` em prompts >12k chars.
 *
 * Falhas não são fatais: se a sumarização der erro, a coluna fica NULL
 * e as strategies caem no fallback (transcript cru). Zero regressão.
 */
class SummarizeInterviewJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 900; // 15 min — generoso pra Qwen3:8b em CPU

    public function __construct(public int $interviewId) {}

    public function handle(LlmGeneratorService $service): void
    {
        $interview = Interview::find($this->interviewId);
        if (!$interview || empty($interview->transcript)) {
            return;
        }

        try {
            $prompt = $this->buildSummaryPrompt($interview->transcript);
            $raw = $service->runRawPrompt($prompt);
            $cleaned = $this->stripCodeFences($raw);
            if (trim($cleaned) === '') {
                Log::warning("[SummarizeInterviewJob] resumo vazio pra interview #{$interview->id}");
                return;
            }
            $interview->update(['transcript_summary' => $cleaned]);
            Log::info("[SummarizeInterviewJob] resumo salvo pra interview #{$interview->id}", [
                'transcript_chars' => strlen($interview->transcript),
                'summary_chars' => strlen($cleaned),
            ]);
        } catch (Throwable $e) {
            // Falha silenciosa: strategies caem no transcript cru.
            Log::warning("[SummarizeInterviewJob] falhou pra interview #{$interview->id}: {$e->getMessage()}");
        }
    }

    private function buildSummaryPrompt(string $transcript): string
    {
        return <<<PROMPT
        Resuma a entrevista de requisitos abaixo em formato markdown, em até 1500 caracteres, organizada exatamente nas seções:

        ## Contexto do negócio
        ## Atores e usuários mencionados
        ## Objetivos e necessidades
        ## Problemas e dores reportadas
        ## Funcionalidades desejadas
        ## Restrições e qualidades exigidas
        ## Integrações com terceiros mencionadas

        Regras:
        - Use bullet points curtos.
        - Omita cumprimentos, disclaimers, perguntas sem resposta, conversa casual.
        - Mantenha só o que pode virar: goals, personas, journeys, stories, regras de negócio, cenários de uso, classes/modelo, interfaces do sistema.
        - Não repita informação entre seções.
        - Se uma seção não tiver nada relevante, escreva "- (nenhum identificado)".

        Entrevista:
        {$transcript}
        PROMPT;
    }

    private function stripCodeFences(string $text): string
    {
        // Remove ```markdown ... ``` ou ``` ... ``` se o modelo envelopar.
        $text = preg_replace('/```(?:markdown)?\s*(.*?)\s*```/s', '$1', $text) ?? $text;
        // Remove <think>...</think> residual do Qwen3.
        $text = preg_replace('/<think>.*?<\/think>/s', '', $text) ?? $text;
        return trim($text);
    }
}
