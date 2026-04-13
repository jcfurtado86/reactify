<?php

namespace App\Services\AI\Strategies;

use App\Models\BusinessRule;
use App\Models\Goal;
use App\Models\Interview;
use App\Models\Project;
use App\Models\Story;
use App\Services\AI\BatchedGeneratorStrategy;
use App\Services\AI\ParsesGeminiJson;

class BusinessRuleStrategy implements BatchedGeneratorStrategy
{
    use ParsesGeminiJson;

    public function validationRules(): array { return []; }
    public function label(): string { return 'Regras de Negócio'; }
    public function itemResponseKey(): string { return 'business_rules'; }
    public function aggregateResponseKey(): string { return 'business_rules'; }

    public function missingPrerequisites(Project $project, array $validated): array
    {
        $missing = [];
        if (!Story::where('project_id', $project->id)->exists()) {
            $missing[] = 'Story cadastrada';
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
        return Story::where('project_id', $project->id)->get();
    }

    public function sharedContext(Project $project, array $validated): mixed
    {
        $interviews = Interview::where('project_id', $project->id)
            ->whereNotNull('transcript')->where('transcript', '!=', '')->get();

        $goals = Goal::where('project_id', $project->id)->get();
        $goalsContext = 'Nenhum goal definido.';
        if ($goals->isNotEmpty()) {
            $goalsContext = $goals
                ->map(fn($g) => "- \"{$g->title}\" (Tipo: {$g->type})")
                ->implode("\n");
        }

        $existingRules = BusinessRule::where('project_id', $project->id)->get();

        return [
            'transcripts' => $interviews->pluck('transcript')->implode("\n\n---\n\n"),
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

        Formato de resposta requerido (JSON):
        {
            "business_rules": [
                { "title": "Título da primeira regra de negócio." }
            ]
        }

        IMPORTANTE: Não gere novas regras que contenham o mesmo conteúdo das regras já existestes em nenhum grau.
        IMPORTANTE: Se nenhuma nova regra for pensada, retorne um array "business_rules" vazio.
        IMPORTANTE: Retorne apenas o JSON.
        IMPORTANTE: Não gere novas regras que completam as existentes.
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
}
