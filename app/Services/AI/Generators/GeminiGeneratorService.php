<?php

namespace App\Services\AI\Generators;

use Gemini\Data\GenerationConfig;
use Gemini\Data\Schema;
use Gemini\Data\ThinkingConfig;
use Gemini\Enums\DataType;
use Gemini\Enums\ResponseMimeType;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Log;

/**
 * Provider plugável: Google Gemini via gemini-laravel.
 *
 * Selecionado quando ARTIFACT_LLM_PROVIDER=gemini no .env. Toda a
 * orquestração vive na AbstractLlmGeneratorService; este arquivo
 * implementa só a chamada ao modelo.
 *
 * Quando a strategy fornece um JSON Schema, convertemos pra Schema object
 * do SDK e passamos via GenerationConfig.responseSchema +
 * responseMimeType=application/json. O Gemini emite a resposta já
 * estruturada exatamente no formato pedido.
 */
class GeminiGeneratorService extends AbstractLlmGeneratorService
{
    protected function callLlm(string $prompt, ?array $schema = null): string
    {
        $modelName = config('services.llm.gemini_model');

        $maxAttempts = 3;
        $attempt = 0;
        $lastError = null;

        while ($attempt < $maxAttempts) {
            $attempt++;
            try {
                $builder = Gemini::generativeModel(model: $modelName);

                // Desabilita thinking mode (default em Gemini 2.5 Flash) — pra
                // extração estruturada de dados não precisa de reasoning, e
                // corta o tempo de resposta em 50-70%.
                $noThinking = new ThinkingConfig(
                    includeThoughts: false,
                    thinkingBudget: 0,
                );

                if ($schema !== null) {
                    $builder = $builder->withGenerationConfig(
                        new GenerationConfig(
                            responseMimeType: ResponseMimeType::APPLICATION_JSON,
                            responseSchema: $this->buildGeminiSchema($schema),
                            thinkingConfig: $noThinking,
                        )
                    );
                } else {
                    $builder = $builder->withGenerationConfig(
                        new GenerationConfig(
                            thinkingConfig: $noThinking,
                        )
                    );
                }

                $result = $builder->generateContent($prompt);
                $text = $result->text();

                Log::info('[GeminiGeneratorService] raw response', [
                    'model' => $modelName,
                    'prompt_chars' => strlen($prompt),
                    'response_chars' => strlen($text),
                    'attempt' => $attempt,
                    'response_preview' => mb_substr($text, 0, 500),
                ]);

                return $text;
            } catch (\Throwable $e) {
                $lastError = $e;
                $msg = $e->getMessage();
                $isRetryable = str_contains($msg, 'high demand')
                    || str_contains($msg, '503')
                    || str_contains($msg, '429')
                    || str_contains($msg, 'Operation timed out')
                    || str_contains($msg, 'rate limit');

                if (!$isRetryable || $attempt >= $maxAttempts) {
                    throw $e;
                }

                // Backoff: 5s, 15s, 35s — o quota do free tier pede "retry in
                // 30s" em rate limits, então precisamos esperar mais que isso.
                $delay = match ($attempt) {
                    1 => 5,
                    2 => 15,
                    3 => 35,
                    default => 35,
                };
                Log::warning('[GeminiGeneratorService] retry após falha', [
                    'attempt' => $attempt,
                    'delay_seconds' => $delay,
                    'error' => $msg,
                ]);
                sleep($delay);
            }
        }

        throw $lastError ?? new \RuntimeException('Gemini falhou sem exceção capturada.');
    }

    /**
     * Converte um JSON Schema (array associativo) em `Gemini\Data\Schema`
     * recursivamente. O SDK tipa strict o campo `responseSchema`, então
     * não dá pra passar array cru — a gente monta a árvore de objetos.
     */
    private function buildGeminiSchema(array $arr): Schema
    {
        $type = match ($arr['type'] ?? 'string') {
            'object' => DataType::OBJECT,
            'array' => DataType::ARRAY,
            'string' => DataType::STRING,
            'integer' => DataType::INTEGER,
            'number' => DataType::NUMBER,
            'boolean' => DataType::BOOLEAN,
            default => DataType::STRING,
        };

        $properties = null;
        if (isset($arr['properties']) && is_array($arr['properties'])) {
            $properties = [];
            foreach ($arr['properties'] as $key => $sub) {
                $properties[$key] = $this->buildGeminiSchema($sub);
            }
        }

        $items = null;
        if (isset($arr['items']) && is_array($arr['items'])) {
            $items = $this->buildGeminiSchema($arr['items']);
        }

        return new Schema(
            type: $type,
            enum: $arr['enum'] ?? null,
            properties: $properties,
            required: $arr['required'] ?? null,
            items: $items,
        );
    }
}
