<?php

namespace App\Services\AI\Strategies;

use App\Models\Interview;
use App\Models\Project;
use App\Models\Story;
use App\Services\AI\GeneratorStrategy;
use App\Services\AI\ParsesGeminiJson;

class EpicStoryStrategy implements GeneratorStrategy
{
    use ParsesGeminiJson;

    public function validationRules(): array { return []; }
    public function label(): string { return 'Epic Stories'; }
    public function responseKeys(): array { return ['decomposed_epics']; }

    public function missingPrerequisites(Project $project, array $validated): array
    {
        // Lista de épicos já decompostos
        $decomposedEpicIds = Story::where('project_id', $project->id)
            ->whereNotNull('epic_id')
            ->distinct()
            ->pluck('epic_id')
            ->toArray();

        $hasStoriesToAnalyze = Story::where('project_id', $project->id)
            ->whereNull('epic_id')
            ->whereNotIn('id', $decomposedEpicIds)
            ->exists();

        if (!$hasStoriesToAnalyze) {
            return ['Nenhuma estória (que já não tenha sido decomposta) foi encontrada para analisar.'];
        }
        return [];
    }

    public function buildContext(Project $project, array $validated): mixed
    {
        $decomposedEpicIds = Story::where('project_id', $project->id)
            ->whereNotNull('epic_id')
            ->distinct()
            ->pluck('epic_id')
            ->toArray();

        $stories = Story::where('project_id', $project->id)
            ->whereNull('epic_id')
            ->whereNotIn('id', $decomposedEpicIds)
            ->get();

        $interviews = Interview::where('project_id', $project->id)
            ->whereNotNull('transcript')->where('transcript', '!=', '')->get();

        return [
            'stories' => $stories,
            'transcripts' => $interviews->pluck('transcript')->implode("\n\n---\n\n"),
        ];
    }

    public function buildPrompt(mixed $context): string
    {
        $stories = $context['stories'];
        $interviewContext = $context['transcripts'];

        $storyContext = $stories->map(
            fn($s) => "- ID {$s->id}; \"{$s->title}\"; \"{$s->type} story\""
        )->implode("\n");

        return <<<PROMPT
        Sua primeira e mais importante tarefa é analisar CUIDADOSAMENTE cada User Story para determinar se ela é, de fato, um "Épico".
        Um épico é uma estória que é claramente grande demais, que abrange múltiplas funcionalidades distintas ou que não poderia ser concluída em um único ciclo de desenvolvimento (sprint).

        REGRA: Se uma estória descreve uma única ação ou um fluxo contínuo e coeso, ela NÃO é um épico e NÃO deve ser decomposta.
        Apenas depois de justificar internamente que uma estória é um épico, você deve prosseguir para a sua decomposição.

        Lista de Stories para Análise (Apenas estórias que ainda não foram decompostas):
        {$storyContext}

        Contexto das entrevistas de requisitos do Projeto (Use como base de conhecimento):
        {$interviewContext}

        **Fim do contexto da entrevista**

        REGRA: Analise apenas as estórias da lista principal que **NÃO** estão na lista de "ÉPICOS JÁ DECOMPOSTOS".

        O formato de resposta requerido é um JSON contendo os épicos identificados e suas respectivas estórias decompostas.

        Formato de resposta requerido (JSON):
        {
            "decomposed_epics": [
                {
                    "original_epic_id": <ID da estória original>,
                    "original_epic_title": "Título da estória original",
                    "new_stories": [
                        { "title": "Título da primeira estória menor", "type": "user" },
                        { "title": "Título da segunda estória menor", "type": "user" }
                    ]
                }
            ]
        }

        IMPORTANTE: Se nenhuma estória (que não esteja na lista de já decompostos) for considerada um épico, retorne um array "decomposed_epics" vazio.
        IMPORTANTE: As novas estórias decompostas devem obrigatoriamente manter o mesmo 'type' ('user' ou 'system') da estória épica original da qual elas se originaram.
        IMPORTANTE: Retorne apenas o JSON.
        PROMPT;
    }

    public function parseResponse(string $responseText): array
    {
        $data = $this->extractJsonArray($responseText);
        if (!isset($data['decomposed_epics']) || !is_array($data['decomposed_epics'])) {
            throw new \Exception("A resposta da IA não contém 'decomposed_epics'.");
        }
        return $data;
    }

    public function postProcess(array $parsed, Project $project, array $validated): array
    {
        return $parsed;
    }
}
