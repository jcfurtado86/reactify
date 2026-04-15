<?php

namespace App\Services\AI\Strategies;

use App\Models\Interview;
use App\Models\Project;
use App\Models\Story;
use App\Models\UsageScenario;
use App\Services\AI\BatchedGeneratorStrategy;
use App\Services\AI\ParsesLlmJson;

class UsageScenarioStrategy implements BatchedGeneratorStrategy
{
    use ParsesLlmJson;

    public function validationRules(): array { return []; }
    public function label(): string { return 'Cenários de Uso'; }
    public function itemResponseKey(): string { return 'usage_scenarios'; }
    public function aggregateResponseKey(): string { return 'usage_scenarios'; }

    public function missingPrerequisites(Project $project, array $validated): array
    {
        $missing = [];
        // Épicos são identificados por terem stories filhas (epic_id).
        // Usage Scenarios descrevem interação com stories reais, não épicos.
        if (!Story::where('project_id', $project->id)
            ->whereDoesntHave('stories')
            ->exists()) {
            $missing[] = 'Story cadastrada (não épica)';
        }
        $hasInterview = Interview::where('project_id', $project->id)
            ->whereNotNull('transcript')->where('transcript', '!=', '')->exists();
        if (!$hasInterview) {
            $missing[] = 'Entrevista para dar contexto';
        }
        return $missing;
    }

    public function items(Project $project, array $validated): iterable
    {
        return Story::where('project_id', $project->id)
            ->whereDoesntHave('stories')
            ->get();
    }

    public function sharedContext(Project $project, array $validated): mixed
    {
        $interviews = Interview::where('project_id', $project->id)
            ->whereNotNull('transcript')->where('transcript', '!=', '')->get();

        $existing = UsageScenario::where('project_id', $project->id)->get();

        return [
            'transcripts' => $interviews->pluck('transcript')->implode("\n\n---\n\n"),
            'existing_by_story' => $existing->groupBy('story_id'),
        ];
    }

    public function buildPromptForItem(mixed $item, mixed $sharedContext, Project $project): string
    {
        $story = $item;
        $interviewContext = $sharedContext['transcripts'];
        $existingByStory = $sharedContext['existing_by_story'];

        $storyScenariosContext = 'Nenhum.';
        if (isset($existingByStory[$story->id])) {
            $storyScenariosContext = $existingByStory[$story->id]
                ->map(function ($scenario) {
                    $desc = $scenario->description;
                    if (!is_array($desc)) {
                        $desc = json_decode(strval($desc), true) ?? [];
                    }
                    $str = "- Cenário:\n";
                    $keyMap = ['as' => 'COMO', 'given' => 'DADO QUE', 'when' => 'QUANDO'];
                    foreach ($desc as $key => $value) {
                        if (isset($keyMap[$key])) {
                            $str .= '    - ' . $keyMap[$key] . ': ' . $value . "\n";
                        } elseif (str_starts_with($key, 'then')) {
                            $str .= '    - ENTÃO: ' . $value . "\n";
                        } elseif (str_starts_with($key, 'and')) {
                            $str .= '    - E: ' . $value . "\n";
                        }
                    }
                    return $str;
                })
                ->implode("\n\n");
        }

        return <<<PROMPT
        Sua tarefa é criar Cenários de Uso para a Story fornecida, representando-os como Cenários de Aceitação no padrão GIVEN-WHEN-THEN.

        STORY (Foco principal):
        "Tipo: {$story->type} story"
        "Descrição: {$story->title}"

        Contexto das entrevistas de requisitos do Projeto (Use como base de conhecimento):
        {$interviewContext}

        CENÁRIOS JÁ EXISTENTES PARA ESTA STORY:
        {$storyScenariosContext}

        O **NOVO** cenário deve seguir a estrutura:
        - 'as': O papel do usuário.
        - 'given': A pré-condição ou o contexto inicial.
        - 'when': A ação que o usuário realiza.
        - 'then_1': O resultado esperado principal.
        - 'and' / 'then_2': Opcionais, sempre em par.

        REGRA: Um 'and' em hipótese alguma deve existir sem um 'then' logo apos ele.

        Formato de resposta requerido (JSON):
        {
            "usage_scenarios": [
                {
                    "description": {
                        "as": "O papel do usuário",
                        "given": "Dado que...",
                        "when": "Quando eu...",
                        "then_1": "Então eu deveria..."
                    }
                }
            ]
        }

        IMPORTANTE: Gere apenas cenários que AINDA NÃO EXISTEM na lista fornecida.
        IMPORTANTE: Se nenhum novo cenário for encontrado, retorne um array "usage_scenarios" vazio.
        IMPORTANTE: Retorne apenas o JSON.
        IMPORTANTE: Gere o mínimo de artefatos, foque nas principais.
        PROMPT;
    }

    public function parseResponse(string $responseText): array
    {
        $data = $this->extractJsonArray($responseText);
        if (!isset($data['usage_scenarios']) || !is_array($data['usage_scenarios'])) {
            throw new \Exception("A resposta da IA não contém 'usage_scenarios'.");
        }
        return $data;
    }

    public function enrichGeneratedItem(array $generated, mixed $sourceItem, Project $project, array $validated): array
    {
        $generated['story_id'] = $sourceItem->id;
        $generated['project_id'] = $project->id;
        return $generated;
    }

    public function persistGenerated(array $parsed, Project $project, array $validated): void
    {
        foreach ($parsed['usage_scenarios'] ?? [] as $scenarioData) {
            UsageScenario::create([
                'project_id' => $project->id,
                'story_id' => $scenarioData['story_id'] ?? null,
                'description' => $scenarioData['description'] ?? [],
                'is_ai_generated' => true,
            ]);
        }
    }
}
