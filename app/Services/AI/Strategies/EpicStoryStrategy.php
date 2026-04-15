<?php

namespace App\Services\AI\Strategies;

use App\Models\Interview;
use App\Models\Project;
use App\Models\Story;
use App\Services\AI\GeneratorStrategy;
use App\Services\AI\ParsesLlmJson;

class EpicStoryStrategy implements GeneratorStrategy
{
    use ParsesLlmJson;

    public function validationRules(): array { return []; }
    public function label(): string { return 'Epic Stories'; }

    public function responseSchema(): ?array
    {
        return [
            'type' => 'object',
            'properties' => [
                'decomposed_epics' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'original_epic_id' => ['type' => 'integer'],
                            'original_epic_title' => ['type' => 'string'],
                            'new_stories' => [
                                'type' => 'array',
                                'items' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'title' => ['type' => 'string'],
                                        'type' => ['type' => 'string', 'enum' => ['user', 'system']],
                                    ],
                                    'required' => ['title', 'type'],
                                ],
                            ],
                        ],
                        'required' => ['original_epic_id', 'original_epic_title', 'new_stories'],
                    ],
                ],
            ],
            'required' => ['decomposed_epics'],
        ];
    }

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

        return [
            'stories' => $stories,
            'transcripts' => Interview::aiContextForProject($project->id),
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
        Sua tarefa é analisar cada story e decidir se ela é um **épico** que precisa ser decomposto em stories menores.

        DEFINIÇÃO DE ÉPICO: uma story é épica se **qualquer** um destes critérios for verdadeiro:
        - Exige esforço acima de uma sprint (~2 semanas) pra ser entregue.
        - Abrange **múltiplas funcionalidades distintas** (ex: "cadastrar + notificar + relatar" = 3 stories).
        - Exige refactor ou mudança em múltiplos módulos do sistema simultaneamente.

        Exemplo de ÉPICO (decomponha): "Como gestor, quero um painel completo de analytics com filtros, gráficos, exportação e alertas configuráveis."
        Exemplo de story NORMAL (não decomponha): "Como cliente, quero filtrar veículos disponíveis por data."

        REGRA: Se uma story descreve uma única ação ou um fluxo contínuo e coeso, ela NÃO é um épico e NÃO deve ser decomposta.

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

    public function persistGenerated(array $parsed, Project $project, array $validated): void
    {
        foreach ($parsed['decomposed_epics'] ?? [] as $epic) {
            $epicId = $epic['original_epic_id'] ?? null;
            if (!$epicId) {
                continue;
            }
            foreach ($epic['new_stories'] ?? [] as $newStory) {
                Story::create([
                    'project_id' => $project->id,
                    'epic_id' => $epicId,
                    'title' => $newStory['title'] ?? '',
                    'type' => $newStory['type'] ?? 'user',
                    'is_ai_generated' => true,
                ]);
            }
        }
    }
}
