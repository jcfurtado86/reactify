<?php

namespace App\Services\AI\Strategies;

use App\Models\Goal;
use App\Models\Interview;
use App\Models\ProductCanvas;
use App\Models\Project;
use App\Services\AI\GeneratorStrategy;
use App\Services\AI\ParsesLlmJson;

class GoalStrategy implements GeneratorStrategy
{
    use ParsesLlmJson;

    public function validationRules(): array { return []; }
    public function label(): string { return 'Goals'; }

    public function responseSchema(): ?array
    {
        return [
            'type' => 'object',
            'properties' => [
                'goals' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'title' => ['type' => 'string'],
                            'type' => ['type' => 'string', 'enum' => ['bg', 'cg']],
                            'priority' => ['type' => 'string', 'enum' => ['high', 'medium', 'low']],
                        ],
                        'required' => ['title', 'type', 'priority'],
                    ],
                ],
            ],
            'required' => ['goals'],
        ];
    }

    public function responseKeys(): array { return ['goals']; }

    public function missingPrerequisites(Project $project, array $validated): array
    {
        $hasInterview = Interview::where('project_id', $project->id)
            ->whereNotNull('transcript')->where('transcript', '!=', '')->exists();
        return $hasInterview
            ? []
            : ['Nenhuma entrevista com transcrição foi encontrada neste projeto para análise.'];
    }

    public function buildContext(Project $project, array $validated): mixed
    {
        $existing = Goal::where('project_id', $project->id)
            ->whereNull('deleted_at')->get();

        $existingContext = 'Nenhum.';
        if ($existing->isNotEmpty()) {
            $existingContext = $existing->map(
                fn($goal) => "- \"{$goal->title}\" (Tipo: {$goal->type})"
            )->implode("\n");
        }

        $canvas = ProductCanvas::where('project_id', $project->id)->first();
        $canvasContext = 'Nenhum Product Canvas definido.';
        if ($canvas) {
            $parts = [];
            if (!empty($canvas->product_is)) $parts[] = "Produto É: {$canvas->product_is}";
            if (!empty($canvas->product_is_not)) $parts[] = "Produto NÃO É: {$canvas->product_is_not}";
            if (!empty($canvas->issues)) $parts[] = "Problemas: {$canvas->issues}";
            if (!empty($canvas->solutions)) $parts[] = "Soluções: {$canvas->solutions}";
            if (!empty($canvas->restrictions)) $parts[] = "Restrições: {$canvas->restrictions}";
            if (!empty($parts)) {
                $canvasContext = implode("\n", $parts);
            }
        }

        return [
            'transcripts' => Interview::aiContextForProject($project->id),
            'existing' => $existingContext,
            'canvas' => $canvasContext,
        ];
    }

    public function buildPrompt(mixed $context): string
    {
        $transcript = $context['transcripts'];
        $existing = $context['existing'];
        $canvas = $context['canvas'];

        return <<<PROMPT
        Analise a transcrição da entrevista abaixo e extraia os objetivos de negócio (Business Goals) e as restrições (Constraint Goals).

        Transcrição: "{$transcript}"

        **Product Canvas do Projeto (use como orientação):**
        {$canvas}

        LISTA DE GOALS JÁ EXISTENTES (NÃO REPITA):
        {$existing}

        Sua tarefa é identificar:
        1.  **Business Goals (type: "bg")**: Objetivos principais que o negócio ou o usuário quer alcançar. O que gera valor?
        2.  **Constraint Goals (type: "cg")**: Restrições, qualidades ou requisitos não-funcionais que o sistema deve ter.

        Exemplos:
        - Business Goal: "Reduzir em 30% o tempo de checkout do aluguel."
        - Constraint Goal: "O sistema deve estar disponível em desktop e mobile."

        Para cada goal identificado, atribua uma prioridade ('high', 'medium', 'low') com base na ênfase dada pelo entrevistado.

        Formato de resposta requerido (JSON):
        {
            "goals": [
                {
                    "title": "Texto do goal extraído da entrevista",
                    "type": "bg" | "cg",
                    "priority": "high" | "medium" | "low"
                }
            ]
        }

        IMPORTANTE: Baseie-se **exclusivamente** no conteúdo da transcrição.
        IMPORTANTE: Gere apenas goals que AINDA NÃO EXISTEM na lista de "Goals já existentes". Se nenhum novo goal for encontrado, retorne um array "goals" vazio.
        IMPORTANTE: Retorne apenas o JSON.
        PROMPT;
    }

    public function parseResponse(string $responseText): array
    {
        $data = $this->extractJsonArray($responseText);
        if (!isset($data['goals']) || !is_array($data['goals'])) {
            throw new \Exception("A resposta da IA não contém um array 'goals' válido.");
        }
        return $data;
    }

    public function postProcess(array $parsed, Project $project, array $validated): array
    {
        return $parsed;
    }

    public function persistGenerated(array $parsed, Project $project, array $validated): void
    {
        foreach ($parsed['goals'] ?? [] as $goalData) {
            Goal::create([
                'project_id' => $project->id,
                'title' => $goalData['title'] ?? '',
                'type' => $goalData['type'] ?? 'bg',
                'priority' => $goalData['priority'] ?? 'medium',
                'is_ai_generated' => true,
            ]);
        }
    }
}
