<?php

namespace App\Services\AI\Strategies;

use App\Models\CrcCard;
use App\Models\Interview;
use App\Models\OverallModelClass;
use App\Models\Project;
use App\Models\Story;
use App\Models\SystemInterface;
use App\Services\AI\GeneratorStrategy;
use App\Services\AI\ParsesLlmJson;

class SystemInterfaceStrategy implements GeneratorStrategy
{
    use ParsesLlmJson;

    public function validationRules(): array { return []; }
    public function label(): string { return 'Interfaces de Sistema'; }

    public function responseSchema(): ?array
    {
        return [
            'type' => 'object',
            'properties' => [
                'system_interfaces' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'title' => ['type' => 'string'],
                            'input' => ['type' => 'string'],
                            'output' => ['type' => 'string'],
                            'type' => ['type' => 'string', 'enum' => ['internal', 'external']],
                            'related_classes' => ['type' => 'array', 'items' => ['type' => 'string']],
                        ],
                        'required' => ['title', 'input', 'output', 'type', 'related_classes'],
                    ],
                ],
            ],
            'required' => ['system_interfaces'],
        ];
    }

    public function responseKeys(): array { return ['system_interfaces']; }

    public function missingPrerequisites(Project $project, array $validated): array
    {
        $missing = [];
        if (!CrcCard::where('project_id', $project->id)->exists()) {
            $missing[] = 'CRC Card cadastrado';
        }
        if (!Story::where('project_id', $project->id)->exists()) {
            $missing[] = 'Estória cadastrada';
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
        $crcCards = CrcCard::where('project_id', $project->id)->get();
        $stories = Story::where('project_id', $project->id)->get();

        $existing = SystemInterface::where('project_id', $project->id)->get();
        $existingContext = 'Nenhuma.';
        if ($existing->isNotEmpty()) {
            $existingContext = $existing
                ->map(fn($i) => "- {$i->title} (Tipo: {$i->type})")
                ->implode("\n");
        }

        $classMap = OverallModelClass::where('project_id', $project->id)->pluck('id', 'name');

        $context = "CRC Cards do Projeto:\n";
        $crcCards->each(function ($card) use (&$context) {
            $responsibilities = is_string($card->responsabilities)
                ? json_decode($card->responsabilities, true)
                : $card->responsabilities;
            $responsibilitiesString = is_array($responsibilities)
                ? implode('; ', $responsibilities)
                : 'Nenhuma';

            $collaborators = is_string($card->collaborators)
                ? json_decode($card->collaborators, true)
                : $card->collaborators;
            $collaboratorsString = is_array($collaborators) && !empty($collaborators)
                ? implode(', ', $collaborators)
                : 'Nenhum';

            $context .= "- Classe: {$card->class}\n";
            $context .= "  - Responsabilidades: {$responsibilitiesString}\n";
            $context .= "  - Colaboradores: {$collaboratorsString}\n";
        });

        $context .= "\nEstórias do Projeto:\n";
        $stories->each(function ($story) use (&$context) {
            $context .= "- {$story->title}\n";
        });

        $context .= "\nContexto das Entrevistas:\n" . Interview::aiContextForProject($project->id);

        return [
            'context' => $context,
            'available_classes' => $crcCards->pluck('class')->toArray(),
            'existing' => $existingContext,
            'class_map' => $classMap,
        ];
    }

    public function buildPrompt(mixed $context): string
    {
        $ctx = $context['context'];
        $existing = $context['existing'];
        $classList = implode('", "', $context['available_classes']);

        return <<<PROMPT
        Sua tarefa é identificar as interfaces internas e externas do produto com base no Overall Model (CRC Cards) e nas Estórias do projeto.

        **Definições e Instruções de Análise:**
        - **Interfaces Internas:** São os pontos de comunicação entre os diversos módulos ou componentes dentro do sistema. **Você deve identificá-las principalmente ao analisar a relação entre uma "Classe" e seus "Colaboradores" nos CRC Cards.** Uma colaboração quase sempre exige uma interface interna.
        - **Interfaces Externas:** São os pontos de comunicação entre o sistema e o ambiente externo. **Você deve identificá-las principalmente ao analisar as "Estórias do Projeto" que descrevem interações com sistemas de terceiros (APIs, redes sociais, gateways de pagamento, etc.).**

        Contexto do Projeto (CRC Cards, Estórias e Entrevistas):
        {$ctx}

        INTERFACES JÁ EXISTENTES (NÃO REPITA):
        {$existing}

        - 'title': Um nome claro para a interface.
        - 'input': Lista estruturada dos dados que a interface recebe, no formato `nome_campo: tipo`, um por linha. Tipos válidos: `string`, `int`, `boolean`, `datetime`, `float`, `array<T>`, `object`. Nada de descrições vagas tipo "dados do usuário".
        - 'output': Lista estruturada dos dados que a interface retorna, no mesmo formato `nome_campo: tipo`.
        - 'type': "external" ou "internal".
        - 'related_classes': Uma lista com os nomes das classes do Overall Model que estão envolvidas nesta interface. Escolha apenas a partir da seguinte lista de classes disponíveis: "{$classList}".

        Exemplo de formato correto de `input`/`output`:
        "input": "username: string\\npassword: string\\nremember_me: boolean"
        "output": "token: string\\nexpires_at: datetime\\nuser_id: int"

        Formato de resposta requerido (JSON):
        {
            "system_interfaces": [
                {
                    "title": "Nome da Interface",
                    "input": "Dados de entrada",
                    "output": "Dados de saída",
                    "type": "internal" | "external",
                    "related_classes": ["NomeDaClasse1", "NomeDaClasse2"]
                }
            ]
        }

        TAREFA OBRIGATÓRIA: Identifique TODAS as interfaces relevantes — internas (entre CRC cards) e externas (com sistemas de terceiros mencionados nas stories). Mínimo 4 interfaces. Um projeto típico tem 5-12 interfaces identificáveis.

        IMPORTANTE: Gere apenas interfaces que AINDA NÃO EXISTEM na lista fornecida.
        IMPORTANTE: Retorne apenas o JSON.
        PROMPT;
    }

    public function parseResponse(string $responseText): array
    {
        $data = $this->extractJsonArray($responseText);
        if (!isset($data['system_interfaces']) || !is_array($data['system_interfaces'])) {
            throw new \Exception("A resposta da IA não contém um array 'system_interfaces' válido.");
        }
        return $data;
    }

    public function postProcess(array $parsed, Project $project, array $validated): array
    {
        // Converte related_classes (nomes) para overall_model_class_ids
        $classMap = OverallModelClass::where('project_id', $project->id)->pluck('id', 'name');

        $parsed['system_interfaces'] = array_map(function ($interface) use ($classMap) {
            $classIds = [];
            if (!empty($interface['related_classes'])) {
                foreach ($interface['related_classes'] as $className) {
                    if (isset($classMap[$className])) {
                        $classIds[] = $classMap[$className];
                    }
                }
            }
            $interface['overall_model_class_ids'] = $classIds;
            unset($interface['related_classes']);
            return $interface;
        }, $parsed['system_interfaces']);

        return $parsed;
    }

    public function persistGenerated(array $parsed, Project $project, array $validated): void
    {
        foreach ($parsed['system_interfaces'] ?? [] as $interfaceData) {
            $classIds = $interfaceData['overall_model_class_ids'] ?? [];
            $interface = SystemInterface::create([
                'project_id' => $project->id,
                'title' => $interfaceData['title'] ?? '',
                'input' => $interfaceData['input'] ?? '',
                'output' => $interfaceData['output'] ?? '',
                'type' => $interfaceData['type'] ?? 'internal',
                'is_ai_generated' => true,
            ]);

            // A relação com classes é exclusivamente via pivot
            // overall_model_class_system_interface.
            if (!empty($classIds)) {
                $interface->overallModelClasses()->sync($classIds);
            }
        }
    }
}
