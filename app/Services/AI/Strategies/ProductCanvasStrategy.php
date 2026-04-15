<?php

namespace App\Services\AI\Strategies;

use App\Models\Interview;
use App\Models\Project;
use App\Models\ProductCanvas;
use App\Services\AI\GeneratorStrategy;
use App\Services\AI\ParsesLlmJson;

class ProductCanvasStrategy implements GeneratorStrategy
{
    use ParsesLlmJson;

    public function validationRules(): array
    {
        return [];
    }

    public function label(): string
    {
        return 'Product Canvas';
    }

    public function responseKeys(): array
    {
        return ['product_canvas'];
    }

    public function missingPrerequisites(Project $project, array $validated): array
    {
        $hasInterview = Interview::where('project_id', $project->id)
            ->whereNotNull('transcript')
            ->where('transcript', '!=', '')
            ->exists();

        return $hasInterview ? [] : ['Entrevista com transcrição'];
    }

    public function buildContext(Project $project, array $validated): mixed
    {
        $interviews = Interview::where('project_id', $project->id)
            ->whereNotNull('transcript')
            ->where('transcript', '!=', '')
            ->latest()
            ->get();

        $existing = ProductCanvas::where('project_id', $project->id)
            ->whereNull('deleted_at')
            ->first();

        $existingContext = 'Nenhum canvas preenchido ainda.';
        if ($existing) {
            $existingContext = json_encode([
                'issues' => $existing->issues ?? 'Não definido',
                'solutions' => $existing->solutions ?? 'Não definido',
                'personas' => $existing->personas ?? 'Não definido',
                'restrictions' => $existing->restrictions ?? 'Não definido',
                'product_is' => $existing->product_is ?? 'Não definido',
                'product_is_not' => $existing->product_is_not ?? 'Não definido',
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }

        return [
            'transcripts' => $interviews->pluck('transcript')->implode("\n\n---\n\n"),
            'existing' => $existingContext,
        ];
    }

    public function buildPrompt(mixed $context): string
    {
        $transcripts = $context['transcripts'];
        $existing = $context['existing'];

        return <<<PROMPT
        Sua tarefa é preencher um Product Canvas com base nas transcrições de entrevistas de usuários fornecidas.

        **Definição do Product Canvas**: O Product Canvas é um artefato para estabelecer uma visão de alto nível do produto pretendido. Ele ajuda a definir os problemas a serem solucionados, a solução proposta, os usuários-chave, as restrições, e o que o produto é e não é.

        **Transcrição das Entrevistas:**
        {$transcripts}

        **Product Canvas ATUAL (Use como base para refinar):**
        {$existing}

        Analise a transcrição e extraia as informações para preencher os seguintes campos. O valor de cada campo deve ser um texto conciso e principalmente direto e resumido, formatado com quebras de linha (`\n`) se necessário.
        - 'issues': Os problemas que serão solucionados com o produto.
        - 'solutions': A solução proposta para resolver esses problemas.
        - 'personas': As personas ou usuários-chave da solução.
        - 'restrictions': As restrições do produto, listando as limitações que a solução deve obedecer.
        - 'product_is': O que a solução ou produto será.
        - 'product_is_not': O que a solução ou produto não será.

        O formato de resposta requerido é um JSON com um array de objetos, onde cada objeto representa um campo do canvas.

        Formato de resposta requerido (JSON):
        {
            "product_canvas": [
                { "key": "issues", "label": "Problems", "value": "Texto extraído sobre os problemas..." },
                { "key": "solutions", "label": "Solutions", "value": "Texto extraído sobre as soluções..." },
                { "key": "personas", "label": "Personas", "value": "Texto extraído sobre as personas..." },
                { "key": "restrictions", "label": "Restrictions", "value": "Texto extraído sobre as restrições..." },
                { "key": "product_is", "label": "Product Is", "value": "Texto extraído sobre o que o produto é..." },
                { "key": "product_is_not", "label": "Product Is Not", "value": "Texto extraído sobre o que o produto não é..." }
            ]
        }

        IMPORTANTE: Baseie-se nas transcrições para **refinar o canvas atual**.
        IMPORTANTE: Retorne apenas o JSON.
        IMPORTANTE: Gere o mínimo de artefatos, foque nas principais que refletem bem o núcleo do projeto.
        PROMPT;
    }

    public function parseResponse(string $responseText): array
    {
        $data = $this->extractJsonArray($responseText);
        if (!isset($data['product_canvas']) || !is_array($data['product_canvas'])) {
            throw new \Exception("A resposta da IA não contém um array 'product_canvas' válido.");
        }
        return $data;
    }

    public function postProcess(array $parsed, Project $project, array $validated): array
    {
        return $parsed;
    }

    public function persistGenerated(array $parsed, Project $project, array $validated): void
    {
        // O canvas é singleton por projeto. updateOrCreate na row existente
        // (se houver) ou cria nova. Cada item do array tem {key, value} —
        // mapeamos pra colunas reais.
        $items = $parsed['product_canvas'] ?? [];
        $payload = ['is_ai_generated' => true];

        foreach ($items as $item) {
            $key = $item['key'] ?? null;
            $value = $item['value'] ?? null;
            if (!$key || $value === null) {
                continue;
            }
            // Aceita só os campos conhecidos do canvas.
            if (in_array($key, ['issues', 'solutions', 'personas', 'restrictions', 'product_is', 'product_is_not'], true)) {
                $payload[$key] = $value;
            }
        }

        ProductCanvas::updateOrCreate(
            ['project_id' => $project->id],
            $payload
        );
    }
}
