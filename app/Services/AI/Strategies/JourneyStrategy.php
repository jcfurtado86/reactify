<?php

namespace App\Services\AI\Strategies;

use App\Models\Goal;
use App\Models\Interview;
use App\Models\Journey;
use App\Models\Persona;
use App\Models\Project;
use App\Services\AI\BatchedGeneratorStrategy;
use App\Services\AI\ParsesLlmJson;
use Illuminate\Support\Facades\Log;

class JourneyStrategy implements BatchedGeneratorStrategy
{
    use ParsesLlmJson;

    public function validationRules(): array { return []; }
    public function label(): string { return 'Journeys'; }
    public function itemResponseKey(): string { return 'journeys'; }
    public function aggregateResponseKey(): string { return 'journeys'; }

    public function missingPrerequisites(Project $project, array $validated): array
    {
        $personas = Persona::where('project_id', $project->id)->whereNull('deleted_at')->get();
        if ($personas->isEmpty()) {
            return ['Persona cadastrada'];
        }

        $withGoals = $personas->filter(fn($p) => $this->hasValidGoals($p));
        if ($withGoals->isEmpty()) {
            return ['Persona com goals válidos'];
        }
        return [];
    }

    public function items(Project $project, array $validated): iterable
    {
        return Persona::where('project_id', $project->id)
            ->whereNull('deleted_at')
            ->select('id', 'name', 'goals')
            ->get()
            ->filter(fn($p) => $this->hasValidGoals($p));
    }

    public function sharedContext(Project $project, array $validated): mixed
    {
        $interviews = Interview::where('project_id', $project->id)
            ->whereNotNull('transcript')->where('transcript', '!=', '')->get();

        $existing = Journey::where('project_id', $project->id)
            ->whereNull('deleted_at')->get();

        $existingContext = 'Nenhuma.';
        if ($existing->isNotEmpty()) {
            $existingContext = $existing->map(function ($journey) {
                $str = "- Título: {$journey->title}\n  Passos:\n";
                $steps = is_string($journey->steps) ? json_decode($journey->steps, true) : $journey->steps;
                if (is_array($steps)) {
                    foreach ($steps as $index => $step) {
                        $description = $step['description'] ?? 'Passo sem descrição';
                        $touchpoint = ($step['is_touchpoint'] ?? false) ? ' [TOUCHPOINT]' : '';
                        $str .= '    ' . ($index + 1) . ". {$description}{$touchpoint}\n";
                    }
                } else {
                    $str .= "    (Não foi possível listar os passos)\n";
                }
                return $str;
            })->implode("\n\n");
        }

        $projectGoals = Goal::where('project_id', $project->id)->get();
        $projectGoalsContext = $projectGoals->isEmpty()
            ? 'Nenhum goal definido.'
            : $projectGoals->map(fn($g) => "- \"{$g->title}\" (Tipo: {$g->type})")->implode("\n");

        return [
            'transcripts' => $interviews->pluck('transcript')->implode("\n\n---\n\n"),
            'existing' => $existingContext,
            'project_goals' => $projectGoalsContext,
        ];
    }

    public function buildPromptForItem(mixed $item, mixed $sharedContext, Project $project): string
    {
        $persona = $item;
        $interviewContext = $sharedContext['transcripts'];
        $existing = $sharedContext['existing'];
        $projectGoals = $sharedContext['project_goals'];

        $goals = is_string($persona->goals) ? json_decode($persona->goals, true) : $persona->goals;
        $goalsJson = json_encode($goals, JSON_UNESCAPED_UNICODE);

        return <<<PROMPT
        Você ajuda a elaborar um fluxo de atividades de negócio que evidencie uma jornada de interação de Personas(usuários) com o uso de um produto pretendido.
        A atividade que tenha contato entre a Persona e o Produto pretendido deve ser classificada como um touchpoint, ou seja,
        um ponto de contato que representa uma possível e futura funcionalidade do produto pretendido.
        Esse passo a passo deve incluir também as respostas do produto e não apenas as ações da persona.

        Exemplo:
        - Step NÃO touchpoint: "Sistema calcula tarifa baseado em km rodados." (lógica interna, sem contato)
        - Step TOUCHPOINT: "Cliente confirma reserva no app." (contato direto com o produto)

        Crie journeys para as goals de uma persona listados abaixo:

        - Persona: {$persona->name}
        - Goals: {$goalsJson}

        Contexto das entrevistas de requisitos do Projeto (Use como base de conhecimento):
        {$interviewContext}

        **Goals do Projeto:**
        {$projectGoals}

        LISTA DE JOURNEYS JÁ EXISTENTES (NÃO REPITA):
        {$existing}

        Formato requerido:
        {
            "journeys": [
                {
                    "title": "Título da Journey",
                    "steps": [
                        {"description": "ação", "is_touchpoint": true}
                    ]
                }
            ]
        }

        IMPORTANTE: Retorne apenas o JSON e não use \ para escapar caracteres especiais.
        IMPORTANTE: Gere apenas journeys que AINDA NÃO EXISTEM na lista fornecida. Se nenhuma nova journey for encontrada, retorne um array "journeys" vazio.
        IMPORTANTE: Caso não haja goal para a persona da vez, não gere ou invente uma journey(title, steps)
        IMPORTANTE: Caso o texto da goal não faça sentido, não gere ou invente uma journey(title, steps)
        PROMPT;
    }

    public function parseResponse(string $responseText): array
    {
        $data = $this->extractJsonArray($responseText);
        if (!isset($data['journeys']) || !is_array($data['journeys'])) {
            throw new \Exception("Resposta da IA não contém 'journeys' válidos.");
        }
        return $data;
    }

    public function enrichGeneratedItem(array $generated, mixed $sourceItem, Project $project, array $validated): array
    {
        if (!isset($generated['title']) || !isset($generated['steps'])) {
            Log::warning('Journey inválida gerada pela IA', ['persona_id' => $sourceItem->id]);
            return ['title' => $generated['title'] ?? '', 'steps' => []];
        }

        $validatedSteps = [];
        foreach ($generated['steps'] as $step) {
            if (isset($step['description'])) {
                $validatedSteps[] = [
                    'description' => $step['description'],
                    'is_touchpoint' => isset($step['is_touchpoint']) ? (bool) $step['is_touchpoint'] : false,
                ];
            }
        }

        return [
            'title' => $generated['title'],
            'steps' => $validatedSteps,
        ];
    }

    public function persistGenerated(array $parsed, Project $project, array $validated): void
    {
        foreach ($parsed['journeys'] ?? [] as $journeyData) {
            $rawSteps = $journeyData['steps'] ?? [];
            $steps = [];
            foreach (array_values($rawSteps) as $i => $step) {
                $steps[] = [
                    'id' => 'step_ai_' . uniqid('', true),
                    'step' => $i + 1,
                    'description' => $step['description'] ?? '',
                    'is_touchpoint' => (bool) ($step['is_touchpoint'] ?? false),
                ];
            }

            Journey::create([
                'project_id' => $project->id,
                'title' => $journeyData['title'] ?? 'Jornada sem título',
                'steps' => $steps,
                'is_ai_generated' => true,
            ]);
        }
    }

    private function hasValidGoals(Persona $persona): bool
    {
        if (is_null($persona->goals)) {
            return false;
        }
        $goals = is_string($persona->goals) ? json_decode($persona->goals, true) : $persona->goals;
        if (json_last_error() !== JSON_ERROR_NONE) {
            return false;
        }
        if (!is_array($goals) || empty($goals)) {
            return false;
        }
        foreach ($goals as $goal) {
            if (is_string($goal) && !empty(trim($goal))) return true;
            if (is_array($goal) && !empty($goal)) return true;
        }
        return false;
    }
}
