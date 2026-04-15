<?php

namespace App\Services\AI\Generators;

use Anthropic\Client;
use Illuminate\Support\Facades\Log;

/**
 * Provider plugável: Anthropic Claude via SDK oficial anthropic-ai/sdk.
 *
 * Selecionado quando ARTIFACT_LLM_PROVIDER=claude no .env. Claude não tem
 * um mecanismo `response_format: json_schema` como Gemini/OpenAI; o
 * equivalente é **tool use** com tool_choice forçado. A gente registra
 * uma tool `emit_response` com input_schema = $schema, força o modelo a
 * chamar ela, e extrai o bloco tool_use.input como resposta estruturada.
 *
 * Sem schema (chamadas raw, ex: sumarização futura), é uma chamada normal
 * de mensagem e retornamos o texto do primeiro bloco.
 */
class ClaudeGeneratorService extends AbstractLlmGeneratorService
{
    protected function callLlm(string $prompt, ?array $schema = null): string
    {
        $model = config('services.artifact_llm.claude_model', 'claude-haiku-4-5-20251001');
        $apiKey = config('services.artifact_llm.claude_api_key') ?: env('ANTHROPIC_API_KEY');

        $client = new Client(apiKey: $apiKey);

        $params = [
            'maxTokens' => 8192,
            'model' => $model,
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt,
                ],
            ],
            'temperature' => 0.1,
        ];

        if ($schema !== null) {
            $params['tools'] = [[
                'name' => 'emit_response',
                'description' => 'Emit the structured response for this task.',
                'input_schema' => $schema,
            ]];
            $params['toolChoice'] = [
                'type' => 'tool',
                'name' => 'emit_response',
            ];
        }

        $message = $client->messages->create(...$params);

        $text = $this->extractResponseText($message, $schema !== null);

        Log::info('[ClaudeGeneratorService] raw response', [
            'model' => $model,
            'prompt_chars' => strlen($prompt),
            'response_chars' => strlen($text),
            'response_preview' => mb_substr($text, 0, 500),
        ]);

        return $text;
    }

    /**
     * Extrai o conteúdo útil do Message do Claude. Quando há schema (tool use),
     * pegamos o bloco `tool_use` e serializamos seu `input` como JSON pra
     * o parser ParsesLlmJson existente consumir do mesmo jeito que antes.
     *
     * Sem schema, pegamos o primeiro bloco de texto.
     */
    private function extractResponseText(mixed $message, bool $expectToolUse): string
    {
        $content = $message->content ?? [];

        if ($expectToolUse) {
            foreach ($content as $block) {
                $type = is_object($block) ? ($block->type ?? null) : ($block['type'] ?? null);
                if ($type === 'tool_use') {
                    $input = is_object($block) ? ($block->input ?? null) : ($block['input'] ?? null);
                    if ($input === null) {
                        continue;
                    }
                    // Claude retorna input como array/object; normalizamos via JSON.
                    return json_encode($input, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                }
            }
            throw new \RuntimeException('Claude não retornou bloco tool_use como esperado.');
        }

        // Sem schema: pega o primeiro bloco de texto.
        foreach ($content as $block) {
            $type = is_object($block) ? ($block->type ?? null) : ($block['type'] ?? null);
            if ($type === 'text') {
                return is_object($block) ? ($block->text ?? '') : ($block['text'] ?? '');
            }
        }

        return '';
    }
}
