<?php

namespace App\Services\AI\Generators;

use Cloudstudio\Ollama\Facades\Ollama;
use Illuminate\Support\Facades\Log;

/**
 * Provider plugável: Ollama local (default).
 *
 * Selecionado quando ARTIFACT_LLM_PROVIDER=ollama (ou omitido) no .env.
 * Aponta pro Ollama configurado em config/ollama-laravel.php (URL +
 * timeout). Modelo default qwen3:8b — trocável via
 * ARTIFACT_LLM_OLLAMA_MODEL.
 *
 * O thinking mode do Qwen3 é desligado por default pra cortar drasticamente
 * a latência em CPU. Aplicamos /no_think (convenção do prompt) + payload
 * `think: false` (ollama recente) + strip de <think>...</think> residual
 * como tripla camada de proteção.
 */
class OllamaGeneratorService extends AbstractLlmGeneratorService
{
    protected function callLlm(string $prompt, ?array $schema = null): string
    {
        $model = config('services.llm.ollama_model');
        $think = (bool) config('services.llm.ollama_think', false);

        $prefix = $think ? '' : '/no_think ';

        // Se a strategy forneceu um JSON Schema, passamos ele pro Ollama
        // via ->format($schema) — o Ollama aplica constrained decoding
        // que força a resposta a seguir EXATAMENTE o schema. Quando o
        // chamador não passa schema (ex: SummarizeInterviewJob que quer
        // markdown cru), NÃO aplicamos format, deixando o modelo livre
        // pra emitir texto. Passar 'json' como fallback faria o modelo
        // envelopar o texto em JSON automaticamente, o que não é o que
        // queremos nesse caso.
        $builder = Ollama::agent('Você é um especialista em engenharia de software.')
            ->prompt($prefix . $prompt)
            ->model($model);

        if ($schema !== null) {
            $builder->format($schema);
        }

        $response = $builder
            ->options([
                'temperature' => 0.1,
                'num_ctx' => 32768,
                'num_predict' => 8192,
            ])
            ->stream(false)
            ->ask();

        $text = $response['response'] ?? '';

        Log::info('[OllamaGeneratorService] raw response', [
            'model' => $model,
            'prompt_chars' => strlen($prompt),
            'response_chars' => strlen($text),
            'response_preview' => mb_substr($text, 0, 2000),
        ]);

        // Defesa: remove qualquer <think>...</think> que ainda vaze.
        return preg_replace('/<think>.*?<\/think>/s', '', $text);
    }
}
