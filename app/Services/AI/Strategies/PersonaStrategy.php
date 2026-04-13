<?php

namespace App\Services\AI\Strategies;

use App\Models\Interview;
use App\Models\Persona;
use App\Models\Project;
use App\Services\AI\GeneratorStrategy;
use App\Services\AI\ParsesGeminiJson;

class PersonaStrategy implements GeneratorStrategy
{
    use ParsesGeminiJson;

    public function validationRules(): array { return []; }
    public function label(): string { return 'Personas'; }
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
        $interviews = Interview::where('project_id', $project->id)
            ->whereNotNull('transcript')->where('transcript', '!=', '')
            ->latest()->get();

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

        return [
            'transcripts' => $interviews->pluck('transcript')->implode("\n\n---\n\n"),
            'existing' => $existingContext,
        ];
    }

    public function buildPrompt(mixed $context): string
    {
        $escapedTranscript = json_encode($context['transcripts']);
        $existing = $context['existing'];

        return <<<PROMPT
        Com base na transcrição da entrevista de usuário fornecida abaixo, analise o texto e crie 1 a 2 personas detalhadas.

        Transcrição da Entrevista:
        {$escapedTranscript}

        LISTA DE PERSONAS JÁ EXISTENTES (NÃO REPITA):
        {$existing}

        Sua tarefa é extrair informações do que foi dito na entrevista para preencher os seguintes campos para cada persona:
        - 'name': Crie um nome fictício que represente o perfil do entrevistado.
        - 'profile': Descreva quem é a persona (idade, profissão, hobbies, motivações, comportamentos) com base nas informações da transcrição.
        - 'expectations': Liste o que a persona declarou esperar de um produto ou serviço.
        - 'goals': Liste quais são os objetivos e necessidades que a persona quer alcançar, conforme mencionado na entrevista.

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
        IMPORTANTE: Gere o mínimo de artefatos, foque nas principais que refletem bem o núcleo do projeto.
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
}
