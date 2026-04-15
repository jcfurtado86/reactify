<?php

namespace App\Services\AI\Strategies;

use App\Models\BusinessRule;
use App\Models\Goal;
use App\Models\Interview;
use App\Models\Project;
use App\Models\Story;
use App\Services\AI\BatchedGeneratorStrategy;
use App\Services\AI\ParsesLlmJson;

class BusinessRuleStrategy implements BatchedGeneratorStrategy
{
    use ParsesLlmJson;

    public function validationRules(): array { return []; }
    public function label(): string { return 'Regras de Negócio'; }

    public function responseSchema(): ?array
    {
        return [
            'type' => 'object',
            'properties' => [
                'business_rules' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'title' => ['type' => 'string'],
                            'rule_type' => ['type' => 'string', 'enum' => ['structural', 'dynamic']],
                        ],
                        'required' => ['title', 'rule_type'],
                    ],
                ],
            ],
            'required' => ['business_rules'],
        ];
    }

    public function itemResponseKey(): string { return 'business_rules'; }
    public function aggregateResponseKey(): string { return 'business_rules'; }

    public function missingPrerequisites(Project $project, array $validated): array
    {
        $missing = [];
        // Épicos são identificados por terem stories filhas (epic_id).
        // Se foi quebrado, só as filhas contam. Business Rules derivam
        // das stories reais, nunca do épico.
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
        $goals = Goal::where('project_id', $project->id)->get();
        $goalsContext = 'Nenhum goal definido.';
        if ($goals->isNotEmpty()) {
            $goalsContext = $goals
                ->map(fn($g) => "- \"{$g->title}\" (Tipo: {$g->type})")
                ->implode("\n");
        }

        $existingRules = BusinessRule::where('project_id', $project->id)->get();

        return [
            'transcripts' => Interview::aiContextForProject($project->id),
            'goals' => $goalsContext,
            'existing_by_story' => $existingRules->groupBy('story_id'),
        ];
    }

    public function buildPromptForItem(mixed $item, mixed $sharedContext, Project $project): string
    {
        $story = $item;
        $interviewContext = $sharedContext['transcripts'];
        $goalsContext = $sharedContext['goals'];
        $existingByStory = $sharedContext['existing_by_story'];

        $storyRulesContext = 'Nenhuma.';
        if (isset($existingByStory[$story->id])) {
            $storyRulesContext = $existingByStory[$story->id]
                ->map(fn($rule) => "- \"{$rule->title}\"")
                ->implode("\n");
        }

        return <<<PROMPT
        Sua tarefa agora é extrair as Regras de Negócio (RNs), que são declarações que definem ou restringem alguma parte do negócio.
        **Definição de Regra de Negócio**: Elas servem como informações que evidenciam o contexto de negócio do cliente e como ele opera em termos gerais. Elas devem ser procuradas (refinadas) através da análise de cada Story. Para estabelecer regras de negócio mais completas, você deve considerar as Goals do Projeto previamente identificadas.

        **Tarefa**: Analisar as Goals do Projeto juntamente com a Story do Projeto e as Regras de Negócios já existentes para aquela Story e completar a lista de Regras de Negócios com novas regras que possam contribuir para essa fase do projeto.

        **Story do Projeto para Análise:**
        "Tipo: {$story->type} story"
        "Descrição: {$story->title}"

        **Contexto das entrevistas de requisitos do Projeto (Use como base de conhecimento):**
        {$interviewContext}

        **Fim do contexto da entrevista**

        **Contexto de Goals do Projeto:**
        {$goalsContext}

        **Regras de negócios do Projeto já existentes**
        {$storyRulesContext}

        CLASSIFICAÇÃO DA REGRA — cada regra gerada deve ter um `rule_type`:
        - **structural**: invariante sobre dados ou entidades (ex: "CPF deve ser único", "Veículo não pode ter duas reservas sobrepostas").
        - **dynamic**: condição ou fluxo de comportamento (ex: "Reserva não confirmada em 30 min é cancelada", "Cliente inadimplente é bloqueado ao tentar alugar").

        TAREFA OBRIGATÓRIA: Extraia TODAS as regras de negócio aplicáveis a esta story. Mínimo 3 regras. Não limite o máximo — stories complexas podem ter 5-10 regras relevantes. Use a entrevista, os goals e o contexto da story pra extrair regras concretas. Não retorne array vazio.

        Exemplo de resposta válida:
        {
            "business_rules": [
                { "title": "Cliente não pode ter duas reservas ativas para o mesmo período", "rule_type": "structural" },
                { "title": "Reserva é automaticamente cancelada se não confirmada em 30 minutos", "rule_type": "dynamic" }
            ]
        }

        REGRAS DE FORMATO:
        - Não gere regras que repitam ou completem regras já existentes (veja a lista acima).
        - Todo item DEVE ter `title` (string) e `rule_type` ("structural" ou "dynamic").
        PROMPT;
    }

    public function parseResponse(string $responseText): array
    {
        $data = $this->extractJsonArray($responseText);
        if (!isset($data['business_rules']) || !is_array($data['business_rules'])) {
            throw new \Exception("A resposta da IA não contém 'business_rules'.");
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
        foreach ($parsed['business_rules'] ?? [] as $ruleData) {
            $ruleType = $ruleData['rule_type'] ?? null;
            if (!in_array($ruleType, ['structural', 'dynamic'], true)) {
                $ruleType = null;
            }
            BusinessRule::create([
                'project_id' => $project->id,
                'story_id' => $ruleData['story_id'] ?? null,
                'title' => $ruleData['title'] ?? '',
                'rule_type' => $ruleType,
                'is_ai_generated' => true,
            ]);
        }
    }
}
