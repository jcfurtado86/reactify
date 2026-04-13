<?php

namespace App\Services\AI;

/**
 * Trait compartilhado entre strategies para parsear o texto retornado
 * pelo Gemini. Lida com fences ```json ... ``` e com variantes cruas.
 */
trait ParsesGeminiJson
{
    protected function extractJsonArray(string $content): array
    {
        $cleaned = preg_replace('/```json\n([\s\S]*?)\n```/', '$1', $content);
        $cleaned = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $cleaned);
        $cleaned = preg_replace('/```\s*(.*?)\s*```/s', '$1', $cleaned);
        $cleaned = trim($cleaned);

        return json_decode($cleaned, true, 512, JSON_THROW_ON_ERROR);
    }
}
