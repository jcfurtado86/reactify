<?php

namespace App\Services\AI;

use JsonException;

/**
 * Trait compartilhado entre strategies para parsear o texto cru retornado
 * por qualquer LLM (Ollama/Qwen, Gemini, etc) num array PHP.
 *
 * Foi desenhado pra ser tolerante a output ruidoso. LLMs gostam de:
 *  - vazar `<think>...</think>` mesmo com no_think setado
 *  - prefixar com texto tipo "Aqui está o JSON solicitado:"
 *  - sufixar com explicações ("Espero ter ajudado!")
 *  - usar trailing commas (`,}` e `,]`)
 *  - usar smart quotes curly (“ ” ‘ ’) em vez de retas
 *  - envolver em fences ` ``` ` com ou sem o label `json`
 *  - emitir múltiplos blocos JSON separados
 *
 * O parser percorre 5 camadas, cada uma falha-tolerante:
 *   1. Strip <think>...</think>
 *   2. Strip fences markdown
 *   3. Brace matching balanceado pra extrair APENAS o primeiro objeto/array
 *      JSON válido (joga fora qualquer texto antes/depois)
 *   4. Reparos leves (trailing commas, smart quotes)
 *   5. json_decode com JSON_THROW_ON_ERROR — se falhar aqui, é problema
 *      do modelo, não do parser, e a exceção sobe pro RunArtifactGenerationJob
 *      marcar a row como failed.
 */
trait ParsesLlmJson
{
    protected function extractJsonArray(string $content): array
    {
        // 1. Strip thinking tags (defesa em profundidade).
        $cleaned = preg_replace('/<think>.*?<\/think>/s', '', $content) ?? $content;

        // 2. Strip code fences ```json ... ``` ou ``` ... ```.
        $cleaned = preg_replace('/```(?:json)?\s*(.*?)\s*```/s', '$1', $cleaned) ?? $cleaned;

        // 3. Encontra o primeiro bloco JSON balanceado (objeto OU array).
        $jsonChunk = $this->extractFirstJsonBlock($cleaned);
        if ($jsonChunk === null) {
            throw new JsonException(
                'Nenhum bloco JSON ({...} ou [...]) encontrado na resposta do LLM.'
            );
        }

        // 4. Reparos leves comuns.
        $jsonChunk = $this->repairCommonIssues($jsonChunk);

        // 5. Decode estrito.
        return json_decode($jsonChunk, true, 512, JSON_THROW_ON_ERROR);
    }

    /**
     * Acha o primeiro `{` ou `[` da string e devolve o substring até o
     * fechamento balanceado correspondente, respeitando strings e escapes
     * pra não confundir uma chave dentro de string com um delimitador real.
     */
    private function extractFirstJsonBlock(string $s): ?string
    {
        $len = strlen($s);
        $start = -1;
        $open = '';
        $close = '';

        // Acha o primeiro caractere de abertura.
        for ($i = 0; $i < $len; $i++) {
            if ($s[$i] === '{' || $s[$i] === '[') {
                $start = $i;
                $open = $s[$i];
                $close = $open === '{' ? '}' : ']';
                break;
            }
        }

        if ($start === -1) {
            return null;
        }

        // Brace matching balanceado.
        $depth = 0;
        $inString = false;
        $escape = false;

        for ($i = $start; $i < $len; $i++) {
            $ch = $s[$i];

            if ($escape) {
                $escape = false;
                continue;
            }
            if ($ch === '\\') {
                $escape = true;
                continue;
            }
            if ($ch === '"') {
                $inString = !$inString;
                continue;
            }
            if ($inString) {
                continue;
            }

            if ($ch === $open) {
                $depth++;
            } elseif ($ch === $close) {
                $depth--;
                if ($depth === 0) {
                    return substr($s, $start, $i - $start + 1);
                }
            }
        }

        // Sem fechamento — JSON truncado pelo modelo.
        return null;
    }

    /**
     * Reparos leves que LLMs frequentemente quebram. Não tenta consertar
     * estrutura ruim, só os aborrecimentos triviais.
     */
    private function repairCommonIssues(string $json): string
    {
        // Trailing commas: ,} ou ,] (com possível whitespace).
        $json = preg_replace('/,(\s*[}\]])/', '$1', $json) ?? $json;

        // Smart quotes / curly quotes — substitui pelos equivalentes ASCII.
        $json = strtr($json, [
            "\xe2\x80\x9c" => '"', // “
            "\xe2\x80\x9d" => '"', // ”
            "\xe2\x80\x98" => "'", // ‘
            "\xe2\x80\x99" => "'", // ’
        ]);

        return $json;
    }
}
