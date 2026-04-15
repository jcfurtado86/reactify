<?php

namespace App\Services\AI\Strategies;

use App\Models\BusinessRule;
use App\Models\CrcCard;
use App\Models\Interview;
use App\Models\OverallModelClass;
use App\Models\Project;
use App\Models\Story;
use App\Services\AI\GeneratorStrategy;
use App\Services\AI\ParsesLlmJson;

class OverallModelStrategy implements GeneratorStrategy
{
    use ParsesLlmJson;

    public function validationRules(): array { return []; }
    public function label(): string { return 'Overall Model'; }
    public function responseKeys(): array { return ['crc_cards', 'overall_model_classes']; }

    public function missingPrerequisites(Project $project, array $validated): array
    {
        $missing = [];
        $hasStories = Story::where('project_id', $project->id)->exists();
        if (!$hasStories) {
            $missing[] = 'Estória (User ou System Story) para servir de base';
        }
        $hasInterview = Interview::where('project_id', $project->id)
            ->whereNotNull('transcript')->where('transcript', '!=', '')->exists();
        if (!$hasInterview) {
            $missing[] = 'Entrevista para dar contexto';
        }
        return $missing;
    }

    public function buildContext(Project $project, array $validated): mixed
    {
        $stories = Story::where('project_id', $project->id)->get();
        $interviews = Interview::where('project_id', $project->id)
            ->whereNotNull('transcript')->where('transcript', '!=', '')->get();

        $existingCrc = CrcCard::where('project_id', $project->id)->get();
        $existingClasses = OverallModelClass::where('project_id', $project->id)->get();

        $existingCrcContext = 'Nenhum CRC Card.';
        if ($existingCrc->isNotEmpty()) {
            $existingCrcContext = $existingCrc->map(function ($card) {
                $collab = is_string($card->collaborators)
                    ? json_decode($card->collaborators)
                    : $card->collaborators;
                $collabStr = is_array($collab) ? implode(', ', $collab) : '';
                return "- Classe: {$card->class} (Colaboradores: {$collabStr})";
            })->implode("\n");
        }

        $existingClassesContext = 'Nenhuma Classe.';
        if ($existingClasses->isNotEmpty()) {
            $existingClassesContext = $existingClasses
                ->map(fn($c) => "- {$c->name}")
                ->implode("\n");
        }

        $rules = BusinessRule::where('project_id', $project->id)->get();
        $rulesContext = $rules->isEmpty()
            ? 'Nenhuma regra definida.'
            : $rules->map(fn($r) => "- {$r->title}")->implode("\n");

        return [
            'stories' => $stories->map(fn($s) => "- ({$s->type}): {$s->title}")->implode("\n"),
            'transcripts' => $interviews->pluck('transcript')->implode("\n\n---\n\n"),
            'existing_crc' => $existingCrcContext,
            'existing_classes' => $existingClassesContext,
            'rules' => $rulesContext,
        ];
    }

    public function buildPrompt(mixed $context): string
    {
        $storyContext = $context['stories'];
        $interviewContext = $context['transcripts'];
        $existingCrcContext = $context['existing_crc'];
        $existingClassesContext = $context['existing_classes'];
        $rulesContext = $context['rules'];

        return <<<PROMPT
        Sua tarefa tem duas partes:
        1.  Analise a lista de estórias de um projeto e modele-as como CRC (Class-Responsibility-Collaborator) Cards.
        2.  Liste de forma única todas as classes que você identificou (tanto as classes principais quanto as colaboradoras).


        ESTÓRIAS DO PROJETO (Foco principal para classes e responsabilidades):
        {$storyContext}

        Contexto das entrevistas de requisitos do Projeto (Use como base de conhecimento):
        {$interviewContext}
        **Fim do contexto da entrevista**

        **Regras de Negócio do Projeto (use como invariantes do modelo):**
        {$rulesContext}

        OVERAL MODEL EXISTENTE:
        CRC Cards Atuais:
        {$existingCrcContext}
        Classes Atuais:
        {$existingClassesContext}

        Para cada **NOVA** classe que você identificar, defina:
        - 'class': O nome da classe (um substantivo, ex: "Filme", "Usuário").
        - 'responsabilities': Uma lista de ações que a classe deve executar.
        - 'collaborators': Uma lista de outras classes com as quais ela precisa interagir para cumprir suas responsabilidades.
        - 'overall_model_classes': Todas as classes do sistema

        O formato de resposta requerido é um JSON com duas chaves principais: "crc_cards" e "overall_model_classes".

        Formato de resposta requerido (JSON):
        {
            "crc_cards": [
                {
                    "class": "Nome Da Classe",
                    "responsabilities": ["Fazer algo", "Gerenciar aquilo"],
                    "collaborators": ["Outra Classe", "Servico Externo"]
                }
            ],
            "overall_model_classes": [
                { "name": "Nome Da Classe" },
                { "name": "Outra Classe" }
            ]
        }

        REGRA DE CONSISTÊNCIA: Toda classe mencionada em qualquer `collaborators` de um CRC Card **deve** estar presente em `overall_model_classes`. Se precisar referenciar uma classe que não foi listada ainda, adicione-a em `overall_model_classes` também.

        REGRAS:
        - `overall_model_classes` contém todas as classes (novas + existentes) de forma única.
        - `crc_cards` contém apenas as **NOVAS** classes identificadas.
        - Não repita classes ou CRC cards existentes.
        - Foque nas classes centrais do domínio, não em utilidades técnicas.
        PROMPT;
    }

    public function parseResponse(string $responseText): array
    {
        $data = $this->extractJsonArray($responseText);
        if (!isset($data['crc_cards']) || !isset($data['overall_model_classes'])) {
            throw new \Exception("A resposta da IA não contém 'crc_cards' e 'overall_model_classes'.");
        }
        return $data;
    }

    public function postProcess(array $parsed, Project $project, array $validated): array
    {
        // Sanity check: garante que toda classe em collaborators também
        // aparece em overall_model_classes. Se o modelo esqueceu alguma,
        // injeta automaticamente — evita dangling references no overall model.
        $classNames = collect($parsed['overall_model_classes'] ?? [])
            ->pluck('name')
            ->filter()
            ->map(fn($n) => trim((string) $n))
            ->filter()
            ->values();

        $existingLower = $classNames->map(fn($n) => mb_strtolower($n))->all();

        foreach ($parsed['crc_cards'] ?? [] as $card) {
            foreach ($card['collaborators'] ?? [] as $collab) {
                $name = trim((string) $collab);
                if ($name === '') {
                    continue;
                }
                if (!in_array(mb_strtolower($name), $existingLower, true)) {
                    $parsed['overall_model_classes'][] = ['name' => $name];
                    $existingLower[] = mb_strtolower($name);
                }
            }
        }

        return $parsed;
    }

    public function persistGenerated(array $parsed, Project $project, array $validated): void
    {
        // Cria primeiro as classes (overall_model_classes) — só as novas.
        $existingClassNames = OverallModelClass::where('project_id', $project->id)
            ->pluck('name')
            ->toArray();

        foreach ($parsed['overall_model_classes'] ?? [] as $classData) {
            $name = $classData['name'] ?? null;
            if (!$name || in_array($name, $existingClassNames, true)) {
                continue;
            }
            OverallModelClass::create([
                'project_id' => $project->id,
                'name' => $name,
                'is_ai_generated' => true,
            ]);
        }

        // Depois cria os CRC Cards — só as novas classes.
        $existingCrcClasses = CrcCard::where('project_id', $project->id)
            ->pluck('class')
            ->toArray();

        foreach ($parsed['crc_cards'] ?? [] as $crcData) {
            $className = $crcData['class'] ?? null;
            if (!$className || in_array($className, $existingCrcClasses, true)) {
                continue;
            }
            CrcCard::create([
                'project_id' => $project->id,
                'class' => $className,
                'responsabilities' => $crcData['responsabilities'] ?? [],
                'collaborators' => $crcData['collaborators'] ?? [],
                'is_ai_generated' => true,
            ]);
        }
    }
}
