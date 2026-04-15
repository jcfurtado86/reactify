<?php

namespace App\Services\AI\Strategies;

use App\Models\Goal;
use App\Models\Interview;
use App\Models\Project;
use App\Services\AI\GeneratorStrategy;
use App\Services\AI\ParsesLlmJson;

class GoalStrategy implements GeneratorStrategy
{
    use ParsesLlmJson;

    public function validationRules(): array { return []; }
    public function label(): string { return 'Goals'; }
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
        $interviews = Interview::where('project_id', $project->id)
            ->whereNotNull('transcript')->where('transcript', '!=', '')
            ->latest()->get();

        $existing = Goal::where('project_id', $project->id)
            ->whereNull('deleted_at')->get();

        $existingContext = 'Nenhum.';
        if ($existing->isNotEmpty()) {
            $existingContext = $existing->map(
                fn($goal) => "- \"{$goal->title}\" (Tipo: {$goal->type})"
            )->implode("\n");
        }

        return [
            'transcripts' => $interviews->pluck('transcript')->implode("\n\n---\n\n"),
            'existing' => $existingContext,
        ];
    }

    public function buildPrompt(mixed $context): string
    {
        $transcript = $context['transcripts'];
        $existing = $context['existing'];

        return <<<PROMPT
        Analise a transcrição da entrevista abaixo e extraia os objetivos de negócio (Business Goals) e as restrições (Constraint Goals).

        Transcrição: "{$transcript}"

        LISTA DE GOALS JÁ EXISTENTES (NÃO REPITA):
        {$existing}

        Sua tarefa é identificar:
        1.  **Business Goals (type: "bg")**: Objetivos principais que o negócio ou o usuário quer alcançar. O que gera valor? Ex: "Aumentar o engajamento", "Facilitar a busca por filmes".
        2.  **Constraint Goals (type: "cg")**: Restrições, qualidades ou requisitos não-funcionais que o sistema deve ter. Ex: "A plataforma deve ser segura", "O carregamento precisa ser rápido", "Deve funcionar em celulares".

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
