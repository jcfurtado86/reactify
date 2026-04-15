<?php

namespace App\Services\AI;

use App\Services\AI\Contracts\LlmGeneratorService;
use Illuminate\Support\Facades\Log;

/**
 * Limpa o texto cru que o py_service devolve (whisper ou PDF extraído),
 * passando por chunks pelo LLM ativo via LlmGeneratorService::runRawPrompt.
 *
 * Antes esse cleanup rodava dentro do py_service (qwen_ollama.py); agora
 * é responsabilidade do Laravel, usando o mesmo provider plugável que a
 * geração de artefatos. Trocar de Gemini pra Claude no `.env` troca o
 * provider usado aqui também sem mexer em código.
 *
 * Preserva 100% do conteúdo — o prompt proíbe resumir ou omitir.
 *
 * Fallback: se um chunk falhar, devolve o raw desse chunk e segue.
 * Pior cenário = texto cru, nunca perda.
 */
class TranscriptCleanupService
{
    /**
     * Limite conservador pra caber no contexto + deixar margem pro output.
     * ~24k chars ≈ 6-8k tokens de input.
     */
    private const MAX_CHARS_PER_CHUNK = 24000;
    private const CHUNK_OVERLAP = 500;

    private const SYSTEM_PROMPT = <<<PROMPT
    Você é um assistente que recebe texto cru extraído automaticamente de um PDF ou transcrição de áudio de entrevistas de requisitos de software. O texto pode ter:
    - quebras de linha erradas no meio de frases
    - cabeçalhos e rodapés repetidos
    - pontuação ausente (comum em transcrições Whisper)
    - ordem de colunas bagunçada
    - espaços estranhos

    Sua tarefa é reorganizar o texto para:
    - Parágrafos corretos com pontuação adequada
    - Remover cabeçalhos/rodapés que se repetem
    - Usar markdown leve (apenas **negrito** e listas) quando fizer sentido

    REGRAS ABSOLUTAS:
    - PRESERVE 100% do conteúdo original. Não resuma, não corte, não omita nada.
    - NÃO invente, não acrescente informação que não esteja no texto original.
    - NÃO comente, não explique, não adicione cabeçalhos seus.
    - Responda APENAS com o texto limpo, nada mais.
    PROMPT;

    public function __construct(private LlmGeneratorService $llm) {}

    public function cleanup(string $rawText): string
    {
        if (trim($rawText) === '') {
            return $rawText;
        }

        $chunks = $this->chunk($rawText);
        $cleaned = [];

        foreach ($chunks as $i => $chunk) {
            try {
                $result = $this->llm->runRawPrompt(
                    self::SYSTEM_PROMPT . "\n\nTexto original:\n" . $chunk
                );
                $cleaned[] = $this->stripCodeFences($result);

                Log::info('[TranscriptCleanup] chunk processado', [
                    'chunk' => $i + 1,
                    'total' => count($chunks),
                    'input_chars' => strlen($chunk),
                    'output_chars' => strlen($result),
                ]);
            } catch (\Throwable $e) {
                Log::warning('[TranscriptCleanup] chunk falhou, usando raw', [
                    'chunk' => $i + 1,
                    'error' => $e->getMessage(),
                ]);
                $cleaned[] = $chunk;
            }
        }

        return implode("\n\n", $cleaned);
    }

    /**
     * Quebra o texto em chunks de até MAX_CHARS_PER_CHUNK, cortando em
     * \n\n (parágrafo) ou \n (linha) quando possível, nunca no meio de
     * palavra. Overlap de CHUNK_OVERLAP chars entre chunks pra preservar
     * contexto nas bordas.
     *
     * @return array<int, string>
     */
    private function chunk(string $text): array
    {
        if (strlen($text) <= self::MAX_CHARS_PER_CHUNK) {
            return [$text];
        }

        $chunks = [];
        $cursor = 0;
        $len = strlen($text);

        while ($cursor < $len) {
            $end = min($cursor + self::MAX_CHARS_PER_CHUNK, $len);

            if ($end < $len) {
                // Tenta cortar num \n\n (parágrafo) dentro da janela.
                $slice = substr($text, $cursor, $end - $cursor);
                $breakPos = strrpos($slice, "\n\n");
                if ($breakPos === false || $breakPos < (self::MAX_CHARS_PER_CHUNK / 2)) {
                    // Sem parágrafo razoável, tenta \n (linha).
                    $breakPos = strrpos($slice, "\n");
                }
                if ($breakPos === false || $breakPos < (self::MAX_CHARS_PER_CHUNK / 2)) {
                    // Sem linha razoável, tenta espaço (nunca cortar palavra).
                    $breakPos = strrpos($slice, ' ');
                }
                if ($breakPos !== false && $breakPos > 0) {
                    $end = $cursor + $breakPos;
                }
            }

            $chunks[] = substr($text, $cursor, $end - $cursor);
            if ($end >= $len) {
                break;
            }
            $cursor = max($end - self::CHUNK_OVERLAP, $end - (int) (self::MAX_CHARS_PER_CHUNK / 4));
        }

        return $chunks;
    }

    private function stripCodeFences(string $text): string
    {
        $text = preg_replace('/```(?:markdown|text)?\s*(.*?)\s*```/s', '$1', $text) ?? $text;
        $text = preg_replace('/<think>.*?<\/think>/s', '', $text) ?? $text;
        return trim($text);
    }
}
