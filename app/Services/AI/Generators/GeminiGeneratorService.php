<?php

namespace App\Services\AI\Generators;

use Gemini\Laravel\Facades\Gemini;

/**
 * Provider plugável: Google Gemini via gemini-laravel.
 *
 * Selecionado quando ARTIFACT_LLM_PROVIDER=gemini no .env. Toda a
 * orquestração vive na AbstractLlmGeneratorService; este arquivo
 * implementa só a chamada ao modelo.
 */
class GeminiGeneratorService extends AbstractLlmGeneratorService
{
    protected function callLlm(string $prompt, ?array $schema = null): string
    {
        // Gemini tem seu próprio mecanismo de structured output, mas não
        // está wired aqui ainda. Por enquanto ignoramos o $schema e o
        // modelo fica em free-form com prompt-only (como era antes).
        $modelName = config('gemini.model');
        $result = Gemini::generativeModel(model: $modelName)->generateContent($prompt);
        return $result->text();
    }
}
