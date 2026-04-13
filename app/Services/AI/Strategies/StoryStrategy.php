<?php

namespace App\Services\AI\Strategies;

use App\Models\Interview;
use App\Models\Project;
use App\Models\Story;
use App\Services\AI\GeneratorStrategy;
use App\Services\AI\ParsesGeminiJson;
use Illuminate\Support\Facades\DB;

class StoryStrategy implements GeneratorStrategy
{
    use ParsesGeminiJson;

    public function validationRules(): array { return []; }
    public function label(): string { return 'Stories'; }

    // O frontend espera `data.message.stories` (legado — manter esse
    // wrapping por agora, pra não quebrar o consumer).
    public function responseKeys(): array { return ['message']; }

    public function missingPrerequisites(Project $project, array $validated): array
    {
        $projectId = $project->id;

        $hasInterview = Interview::where('project_id', $projectId)
            ->whereNotNull('transcript')->where('transcript', '!=', '')->exists();

        $personas = DB::table('personas')
            ->select('goals')
            ->where('project_id', $projectId)
            ->whereNull('deleted_at')->get();

        $journeys = DB::table('journeys')
            ->select('id', 'title', 'steps')
            ->where('project_id', $projectId)
            ->whereNull('deleted_at')->get();

        $constraints = DB::table('product_canvas')
            ->where('project_id', $projectId)
            ->whereNotNull('restrictions')->where('restrictions', '!=', '')
            ->whereNull('deleted_at')->exists();

        $constraintGoals = DB::table('goal_sketches')
            ->where('project_id', $projectId)
            ->where('type', 'cg')
            ->whereNull('deleted_at')->get();

        $missing = [];
        if (!$hasInterview) $missing[] = 'Entrevista com transcrição';
        if (!$this->hasContentfulPersonas($personas)) $missing[] = 'Objetivo de Persona';
        if (!$this->hasContentfulJourneys($journeys)) $missing[] = 'Step de Journey';
        if (!$constraints) $missing[] = 'Restrição do Produto';
        if (!$this->hasContentfulConstraintGoals($constraintGoals)) $missing[] = 'Constraint Goal (CG) com título';

        return $missing;
    }

    public function buildContext(Project $project, array $validated): mixed
    {
        $projectId = $project->id;

        $interviews = Interview::where('project_id', $projectId)
            ->whereNotNull('transcript')->where('transcript', '!=', '')
            ->pluck('transcript')->toArray();

        $personas = DB::table('personas')->select('goals')
            ->where('project_id', $projectId)->whereNull('deleted_at')->get()->toArray();

        $journeys = DB::table('journeys')->select('id', 'title', 'steps')
            ->where('project_id', $projectId)->whereNull('deleted_at')->get()->toArray();

        $productConstraints = DB::table('product_canvas')->select('id', 'restrictions')
            ->where('project_id', $projectId)
            ->whereNotNull('restrictions')->where('restrictions', '!=', '')
            ->whereNull('deleted_at')->get()->toArray();

        $constraintGoals = DB::table('goal_sketches')
            ->select('id', 'title', 'type', 'priority')
            ->where('project_id', $projectId)->where('type', 'cg')
            ->whereNull('deleted_at')->get()->toArray();

        $existingStories = Story::where('project_id', $projectId)
            ->whereNull('deleted_at')->get();

        $existingContext = 'Nenhuma.';
        if ($existingStories->isNotEmpty()) {
            $existingContext = $existingStories
                ->map(fn($s) => "- \"{$s->title}\" Tipo:{$s->type}")
                ->implode("\n");
        }

        return [
            'interviews' => $this->formatInterviews($interviews),
            'personas' => $this->formatPersonas($personas),
            'journeys' => $this->formatJourneys($journeys),
            'constraints' => $this->formatConstraints($productConstraints),
            'constraint_goals' => $this->formatConstraintGoals($constraintGoals),
            'existing' => $existingContext,
        ];
    }

    public function buildPrompt(mixed $context): string
    {
        $interviewsText = $context['interviews'];
        $personasText = $context['personas'];
        $journeysText = $context['journeys'];
        $constraintsText = $context['constraints'];
        $constraintGoalsText = $context['constraint_goals'];
        $existingStoriesContext = $context['existing'];

        return <<<PROMPT
        Com base nos dados fornecidos do sistema, gere user stories e system stories no formato especificado abaixo:

        CONTEXTO PRINCIPAL (Use como base de conhecimento do produto):
        - Transcrições de Entrevistas:
        {$interviewsText}

        CONTEXTO PARA NOVAS USER STORIES:
        - Goals das Personas do Produto:
        {$personasText}

        - Journeys do Produto:
        {$journeysText}

        CONTEXTO PARA NOVAS SYSTEM STORIES:
        - Restrições do Produto:
        {$constraintsText}

        - Constraint Goals do Produto:
        {$constraintGoalsText}

        STORIES JÁ EXISTENTES:
        {$existingStoriesContext}

        INSTRUÇÕES:
        1. Para **NOVAS** USER STORIES: Use as Goals das Personas e Journeys como contexto para criar histórias centradas no usuário.
        2. Para **NOVAS** SYSTEM STORIES: Use as Restrições do Produto e Constraint Goals como contexto para criar histórias do sistema. Também acrescente atributos de qualidade na descrição das system stories.

        FORMATO REQUERIDO:
        {
          "stories":
            [
              { "title":"texto da story", "type":"user|system" }
            ]
        }

        3. Após escrever as stories, deve verificar e validar esses requisitos com os critérios INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable).

        IMPORTANTE: Retorne apenas o JSON e não use \ para escapar caracteres especiais.
        IMPORTANTE: Não REPITA as stories existentes.
        IMPORTANTE: Se nenhuma nova story nova for gerada, retorne um array "stories" vazio.
        IMPORTANTE: As novas stories não devem ser parecidas com as stories existentes em nenhum grau de variância ou significado.
        IMPORTANTE: Gere stories baseadas totalmente nos exemplos e informações fornecidos acima.
        IMPORTANTE: Gere o mínimo de artefatos, foque nas principais que refletem bem o núcleo do projeto.
        IMPORTANTE: As stories devem acima de tudo seguir os critérios INVEST descritos acima.
        PROMPT;
    }

    public function parseResponse(string $responseText): array
    {
        $data = $this->extractJsonArray($responseText);
        if (!isset($data['stories']) || !is_array($data['stories'])) {
            throw new \Exception("Resposta da IA não contém 'stories' válidos.");
        }
        // Wrapping em `message` para preservar o contrato legado
        // (o frontend lê `response.data.message.stories`).
        return ['message' => $data];
    }

    public function postProcess(array $parsed, Project $project, array $validated): array
    {
        $stories = $parsed['message']['stories'] ?? [];
        foreach ($stories as &$story) {
            $story['project_id'] = $project->id;
            $story['epic_id'] = null;
        }
        $parsed['message']['stories'] = $stories;
        return $parsed;
    }

    // --- helpers de formatação (iguais ao controller antigo) ---

    private function hasContentfulPersonas($personas): bool
    {
        foreach ($personas as $persona) {
            if (!isset($persona->goals)) continue;
            $goals = is_string($persona->goals) ? json_decode($persona->goals, true) : $persona->goals;
            if (is_array($goals) && !empty($goals)) {
                return true;
            }
        }
        return false;
    }

    private function hasContentfulJourneys($journeys): bool
    {
        foreach ($journeys as $journey) {
            if (!isset($journey->steps)) continue;
            $steps = is_string($journey->steps) ? json_decode($journey->steps, true) : $journey->steps;
            if (is_array($steps) && !empty($steps)) {
                return true;
            }
        }
        return false;
    }

    private function hasContentfulConstraintGoals($constraintGoals): bool
    {
        foreach ($constraintGoals as $goal) {
            if (isset($goal->title) && !empty(trim($goal->title))) {
                return true;
            }
        }
        return false;
    }

    private function formatInterviews(array $interviews): string
    {
        if (empty($interviews)) return 'Nenhuma transcrição de entrevista fornecida.';
        return implode("\n\n---\n\n", $interviews);
    }

    private function formatPersonas(array $personas): string
    {
        if (empty($personas)) return 'Nenhuma persona definida';
        $formatted = [];
        foreach ($personas as $persona) {
            $goals = is_string($persona->goals) ? json_decode($persona->goals, true) : $persona->goals;
            if ($goals) {
                $goalsText = is_array($goals) ? implode(', ', $goals) : $goals;
                $formatted[] = 'Goals: ' . $goalsText;
            }
        }
        return implode("\n\n", $formatted);
    }

    private function formatJourneys(array $journeys): string
    {
        if (empty($journeys)) return 'Nenhuma journey definida';
        $formatted = [];
        foreach ($journeys as $journey) {
            $steps = is_string($journey->steps) ? json_decode($journey->steps, true) : $journey->steps;
            $text = "\nJourney: " . ($journey->title ?? 'N/A');
            if (is_array($steps)) {
                $stepsText = [];
                foreach ($steps as $step) {
                    if (is_array($step) && isset($step['description'])) {
                        $touchpoint = isset($step['is_touchpoint']) && $step['is_touchpoint'] ? ' [TOUCHPOINT]' : '';
                        $stepsText[] = $step['description'] . $touchpoint;
                    } elseif (is_string($step)) {
                        $stepsText[] = $step;
                    }
                }
                $text .= "\nPassos: " . implode(' -> ', $stepsText);
            } else {
                $text .= "\nPassos: " . ($steps ?? 'N/A');
            }
            $formatted[] = $text;
        }
        return implode("\n\n", $formatted);
    }

    private function formatConstraints(array $constraints): string
    {
        if (empty($constraints)) return 'Nenhuma restrição definida';
        $formatted = [];
        foreach ($constraints as $constraint) {
            if (!empty($constraint->restrictions)) {
                $formatted[] = "\nRestrições do Produto: " . $constraint->restrictions;
            }
        }
        return empty($formatted) ? 'Nenhuma restrição definida' : implode("\n", $formatted);
    }

    private function formatConstraintGoals(array $constraintGoals): string
    {
        if (empty($constraintGoals)) return 'Nenhum constraint goal definido';
        $formatted = [];
        foreach ($constraintGoals as $cg) {
            $priority = ucfirst($cg->priority ?? 'N/A');
            $formatted[] = 'Constraint Goal: ' . ($cg->title ?? 'N/A')
                . ' (Prioridade: ' . $priority . ')';
        }
        return implode("\n\n", $formatted);
    }
}
