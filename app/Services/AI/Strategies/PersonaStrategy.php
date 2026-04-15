<?php

namespace App\Services\AI\Strategies;

use App\Models\Goal;
use App\Models\Interview;
use App\Models\Persona;
use App\Models\Project;
use App\Services\AI\GeneratorStrategy;
use App\Services\AI\ParsesLlmJson;

class PersonaStrategy implements GeneratorStrategy
{
    use ParsesLlmJson;

    public function validationRules(): array { return []; }
    public function label(): string { return 'Personas'; }

    public function responseSchema(): ?array
    {
        return [
            'type' => 'object',
            'properties' => [
                'personas' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'name' => ['type' => 'string'],
                            'profile' => ['type' => 'array', 'items' => ['type' => 'string']],
                            'expectations' => ['type' => 'array', 'items' => ['type' => 'string']],
                            'goals' => ['type' => 'array', 'items' => ['type' => 'string']],
                        ],
                        'required' => ['name', 'profile', 'expectations', 'goals'],
                    ],
                ],
            ],
            'required' => ['personas'],
        ];
    }

    public function responseKeys(): array { return ['personas']; }

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
        $existing = Persona::where('project_id', $project->id)
            ->whereNull('deleted_at')->get();

        $existingContext = 'Nenhuma.';
        if ($existing->isNotEmpty()) {
            $existingContext = $existing->map(function ($persona) {
                $str = "- Nome: {$persona->name} (ID: {$persona->id})\n";
                $formatList = function (?array $items, string $label) {
                    $out = "  {$label}:\n";
                    if (!empty($items)) {
                        foreach ($items as $item) {
                            $text = is_string($item) ? $item : json_encode($item);
                            $out .= "    - {$text}\n";
                        }
                    } else {
                        $out .= "    - (Não definido)\n";
                    }
                    return $out;
                };
                $str .= $formatList($persona->profile, 'Perfil');
                $str .= $formatList($persona->expectations, 'Expectativas');
                $str .= $formatList($persona->goals, 'Objetivos');
                return $str;
            })->implode("\n\n");
        }

        $goals = Goal::where('project_id', $project->id)->get();
        $goalsContext = $goals->isEmpty()
            ? 'Nenhum goal definido.'
            : $goals->map(fn($g) => "- \"{$g->title}\" (Tipo: {$g->type})")->implode("\n");

        return [
            'transcripts' => Interview::aiContextForProject($project->id),
            'existing' => $existingContext,
            'goals' => $goalsContext,
        ];
    }

    public function buildPrompt(mixed $context): string
    {
        $escapedTranscript = json_encode($context['transcripts']);
        $existing = $context['existing'];
        $goals = $context['goals'];

        return <<<PROMPT
        Com base na transcrição da entrevista de usuário fornecida abaixo, analise o texto e crie de 2 a 5 personas distintas baseadas nos diferentes arquétipos de usuário mencionados nas entrevistas.

        Transcrição da Entrevista:
        {$escapedTranscript}

        **Goals do Projeto (calibre os perfis contra esses objetivos):**
        {$goals}

        LISTA DE PERSONAS JÁ EXISTENTES (NÃO REPITA):
        {$existing}

        A resposta DEVE seguir exatamente este schema — não invente campos diferentes, não use 'email'/'phone'/'address':
        - 'name' (string): nome fictício que represente o perfil do entrevistado.
        - 'profile' (array de strings): lista de traços da persona (idade, profissão, hobbies, motivações, comportamentos).
        - 'expectations' (array de strings): lista do que a persona declarou esperar de um produto ou serviço.
        - 'goals' (array de strings): lista dos objetivos e necessidades que a persona quer alcançar.

        TAREFA OBRIGATÓRIA: Identifique TODOS os arquétipos de usuário distintos mencionados ou implicados nas entrevistas. Mínimo 2 personas. Não retorne array vazio.

        REGRA DE ATERRAMENTO: Cada item listado em `profile`, `expectations` e `goals` deve refletir informação que aparece literal ou implicitamente no trecho da entrevista. Não invente idades, cargos ou objetivos que não estejam no texto.

        Formato de resposta requerido (JSON):
        {
            "personas": [
                {
                    "name": "Nome da Persona",
                    "profile": ["item de perfil 1", "item de perfil 2"],
                    "expectations": ["item de expectativa 1", "item de expectativa 2"],
                    "goals": ["item de objetivo 1", "item de objetivo 2"]
                }
            ]
        }

        IMPORTANTE: Baseie-se exclusivamente no conteúdo da transcrição fornecida. Não invente informações.
        IMPORTANTE: Gere apenas personas que AINDA NÃO EXISTEM na lista fornecida. Se nenhuma nova persona for identificada, retorne um array "personas" vazio.
        IMPORTANTE: Retorne apenas o JSON. Não inclua texto adicional, explicações ou marcadores de código.
        PROMPT;
    }

    public function parseResponse(string $responseText): array
    {
        $data = $this->extractJsonArray($responseText);
        if (!isset($data['personas']) || !is_array($data['personas'])) {
            throw new \Exception("A resposta da IA não contém um array 'personas' válido.");
        }
        return $data;
    }

    public function postProcess(array $parsed, Project $project, array $validated): array
    {
        return $parsed;
    }

    public function persistGenerated(array $parsed, Project $project, array $validated): void
    {
        foreach ($parsed['personas'] ?? [] as $personaData) {
            Persona::create([
                'project_id' => $project->id,
                'name' => $personaData['name'] ?? 'Persona sem nome',
                'profile' => $personaData['profile'] ?? [],
                'expectations' => $personaData['expectations'] ?? [],
                'goals' => $personaData['goals'] ?? [],
                'is_ai_generated' => true,
            ]);
        }
    }
}
