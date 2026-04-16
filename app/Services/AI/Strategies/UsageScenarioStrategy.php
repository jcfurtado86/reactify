<?php

namespace App\Services\AI\Strategies;

use App\Models\BusinessRule;
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

    public function responseSchema(): ?array
    {
        return [
            'type' => 'object',
            'properties' => [
                'usage_scenarios' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'description' => [
                                'type' => 'object',
                                'properties' => [
                                    'as' => ['type' => 'string'],
                                    'given' => ['type' => 'string'],
                                    'when' => ['type' => 'string'],
                                    'then_1' => ['type' => 'string'],
                                    'and' => ['type' => 'string'],
                                    'then_2' => ['type' => 'string'],
                                ],
                                'required' => ['as', 'given', 'when', 'then_1'],
                            ],
                        ],
                        'required' => ['description'],
                    ],
                ],
            ],
            'required' => ['usage_scenarios'],
        ];
    }

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
            ->where('status', '!=', 'done')
            ->whereDoesntHave('stories')
            ->get();
    }

    public function sharedContext(Project $project, array $validated): mixed
    {
        $existing = UsageScenario::where('project_id', $project->id)->get();

        $rules = BusinessRule::where('project_id', $project->id)->get();

        return [
            'transcripts' => Interview::aiContextForProject($project->id),
            'existing_by_story' => $existing->groupBy('story_id'),
            'rules_by_story' => $rules->groupBy('story_id'),
        ];
    }

    public function buildPromptForItem(mixed $item, mixed $sharedContext, Project $project): string
    {
        $story = $item;
        $interviewContext = $sharedContext['transcripts'];
        $existingByStory = $sharedContext['existing_by_story'];
        $rulesByStory = $sharedContext['rules_by_story'];

        $storyRulesContext = 'Nenhuma regra definida para esta story.';
        if (isset($rulesByStory[$story->id])) {
            $storyRulesContext = $rulesByStory[$story->id]
                ->map(fn($rule) => "- {$rule->title}")
                ->implode("\n");
        }

        $storyScenariosContext = 'Nenhum.';
        if (isset($existingByStory[$story->id])) {
            $storyScenariosContext = $existingByStory[$story->id]
                ->map(function ($scenario) {
                    $desc = $scenario->description;
                    if (!is_array($desc)) {
                        $desc = json_decode(strval($desc), true) ?? [];
                    }
                    $flag = $scenario->is_ai_generated ? '' : ' [APROVADO]';
                    $str = "- Cenário{$flag}:\n";
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

        **Regras de Negócio DESTA Story (não gere cenários que as violem):**
        {$storyRulesContext}

        Cada cenário deve ter:
        - 'as': O papel do usuário.
        - 'given': A pré-condição ou o contexto inicial.
        - 'when': A ação que o usuário realiza.
        - 'then_1': O resultado esperado principal.
        - Opcional: par 'and' + 'then_2' (nunca sozinhos — um 'and' sempre vem com um 'then' depois).

        TAREFA OBRIGATÓRIA: Cubra TODOS os cenários de uso relevantes pra esta story — caminho feliz, condições alternativas, erros e edge cases. Mínimo 3 cenários. Não retorne array vazio.

        Exemplo de resposta válida:
        {
            "usage_scenarios": [
                {
                    "description": {
                        "as": "Cliente autenticado",
                        "given": "Dado que existem veículos disponíveis no período",
                        "when": "Quando eu seleciono um veículo e confirmo a reserva",
                        "then_1": "Então a reserva é criada com status 'pendente'",
                        "and": "E o sistema inicia o contador de 30 min para confirmação",
                        "then_2": "Então recebo notificação de sucesso"
                    }
                }
            ]
        }

        PROTEÇÃO DE ARTEFATOS:
        - Cenarios marcados como [APROVADO] foram validados pelo usuario ou criados manualmente. Nao gere cenarios que repitam, contradigam ou sejam variacoes semanticas desses.
        - Compare semanticamente cada cenario que voce pretende gerar com TODOS os cenarios existentes listados acima. Se o significado for equivalente ou muito proximo, NAO inclua.
        - Gere apenas cenarios NOVOS que complementem os existentes.

        REGRAS DE FORMATO:
        - Respeite as regras de negócio da story (listadas acima) — não crie cenários que as violem.
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
