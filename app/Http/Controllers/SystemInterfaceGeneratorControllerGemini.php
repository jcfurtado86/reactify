<?php

namespace App\Http\Controllers;

use App\Models\CrcCard;
use App\Models\Story;
use App\Models\OverallModelClass;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Log;
use App\Models\Interview;
use App\Models\SystemInterface;

class SystemInterfaceGeneratorControllerGemini extends Controller
{
public function generate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'project_id' => 'required|integer|exists:projects,id',
            ]);
            $projectId = $validated['project_id'];

            $crcCards = CrcCard::where('project_id', $projectId)->get();
            $stories = Story::where('project_id', $projectId)->get();
            $interviews = Interview::where('project_id', $projectId)
                ->whereNotNull('transcript')
                ->where('transcript', '!=', '')
                ->get();

            if ($crcCards->isEmpty() || $stories->isEmpty()) {
                return response()->json([
                    'status' => 'warning',
                    'message' => 'É necessário ter ao menos um CRC Card e uma Estória cadastrados para gerar as interfaces.'
                ], 422);
            }
            if ($interviews->isEmpty()) {
                return response()->json(['status' => 'warning', 'message' => 'Nenhuma entrevista foi encontrada para dar contexto.'], 422);
            }

            $existingInterfaces = SystemInterface::where('project_id', $projectId)->get();
            $existingInterfacesContext = "Nenhuma.";
            if ($existingInterfaces->isNotEmpty()) {
                $existingInterfacesContext = $existingInterfaces->map(fn($if) => "- {$if->title} (Tipo: {$if->type})")->implode("\n");
            }

            $classMap = OverallModelClass::where('project_id', $projectId)->pluck('id', 'name');
            $combinedTranscripts = $interviews->pluck('transcript')->implode("\n\n---\n\n");

            $context = "CRC Cards do Projeto:\n";
            $context = "CRC Cards do Projeto:\n";
            $crcCards->each(function ($card) use (&$context) {
                // Decodifica as Responsabilidades
                $responsibilities = is_string($card->responsabilities) ? json_decode($card->responsabilities, true) : $card->responsabilities;
                $responsibilitiesString = is_array($responsibilities) ? implode('; ', $responsibilities) : 'Nenhuma';

                // Decodifica os Colaboradores
                $collaborators = is_string($card->collaborators) ? json_decode($card->collaborators, true) : $card->collaborators;
                $collaboratorsString = is_array($collaborators) && !empty($collaborators) ? implode(', ', $collaborators) : 'Nenhum';
                
                // Adiciona ao contexto com melhor formatação
                $context .= "- Classe: {$card->class}\n";
                $context .= "  - Responsabilidades: {$responsibilitiesString}\n";
                $context .= "  - Colaboradores: {$collaboratorsString}\n";
            });
            $context .= "\nEstórias do Projeto:\n";
            $stories->each(function ($story) use (&$context) {
                $context .= "- {$story->title}\n";
            });
            $context .= "\nContexto das Entrevistas:\n" . $combinedTranscripts;

            $prompt = $this->createPrompt($context, $crcCards->pluck('class')->toArray(), $existingInterfacesContext);
            Log::info("PROMPT PARA SYSTEM INTERFACES: \n\n{$prompt}:");
            $modelName = config('gemini.model');
            $fullPrompt = 'Você é um especialista em engenharia de software e análise de requisitos. ' . $prompt;

            $result = Gemini::generativeModel(model: $modelName)->generateContent($fullPrompt);
            $responseText = $result->text(); 

            $parsedData = $this->parseResponse($responseText);
            
            $interfacesWithIds = array_map(function($interface) use ($classMap) {
                $classIds = [];
                if (!empty($interface['related_classes'])) {
                    foreach($interface['related_classes'] as $className) {
                        if (isset($classMap[$className])) {
                            $classIds[] = $classMap[$className];
                        }
                    }
                }
                $interface['overall_model_class_ids'] = $classIds;
                unset($interface['related_classes']);
                return $interface;
            }, $parsedData['system_interfaces']);

            return response()->json([
                'status' => 'sucesso',
                'system_interfaces' => $interfacesWithIds
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao gerar Interfaces de Sistema: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Ocorreu um erro no servidor ao gerar as interfaces: '.$e->getMessage()], 500);
        }
    }

    private function createPrompt(string $context, array $availableClasses, string $existingInterfacesContext): string
    {
        $classList = implode('", "', $availableClasses);

        return <<<PROMPT
        Sua tarefa é identificar as interfaces internas e externas do produto com base no Overall Model (CRC Cards) e nas Estórias do projeto.

        **Definições e Instruções de Análise:**
        - **Interfaces Internas:** São os pontos de comunicação entre os diversos módulos ou componentes dentro do sistema. **Você deve identificá-las principalmente ao analisar a relação entre uma "Classe" e seus "Colaboradores" nos CRC Cards.** Uma colaboração quase sempre exige uma interface interna.
        - **Interfaces Externas:** São os pontos de comunicação entre o sistema e o ambiente externo. **Você deve identificá-las principalmente ao analisar as "Estórias do Projeto" que descrevem interações com sistemas de terceiros (APIs, redes sociais, gateways de pagamento, etc.).**

        Contexto do Projeto (CRC Cards, Estórias e Entrevistas):
        {$context}

        INTERFACES JÁ EXISTENTES (NÃO REPITA):
        {$existingInterfacesContext}

        - 'title': Um nome claro para a interface (ex: "API de Pagamento", "Serviço de Autenticação").
        - 'input': Os dados que a interface recebe (ex: "ID do usuário, senha").
        - 'output': Os dados que a interface retorna (ex: "Token de acesso, dados do usuário").
        - 'type': O tipo de interface:
            - "external": Se a comunicação é com um sistema fora da aplicação (ex: API de terceiros, outro microserviço).
            - "internal": Se a comunicação é entre componentes principais dentro da mesma aplicação (ex: Módulo de Pedidos falando com Módulo de Estoque).
        - 'related_classes': Uma lista com os nomes das classes do Overall Model que estão envolvidas nesta interface. Escolha apenas a partir da seguinte lista de classes disponíveis: "{$classList}".


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
        **Fim do formato requerido**

        Exemplo de resposta para um projeto de streaming:
        {
            "system_interfaces": [
                {
                    "title": "Interface de Integração com Instagram",
                    "input": "permissão de acesso à conta de usuário.",
                    "output": "publicação de "story" no perfil do usuário, publicação de "post" no perfil do usuário.",
                    "type": "external",
                    "related_classes": []
                },
                {
                    "title": "Interface de Integração com a Receita Federal",
                    "input": "CPF do usuário",
                    "output": "validação do CPF, validação de dados pessoais",
                    "type": "external",
                    "related_classes": []
                },
                {
                    "title": "Interface de Exibição de Filmes",
                    "input": "seleção de exibição de um filme do catálogo",
                    "output": "exibição do filme",
                    "type": "internal",
                    "related_classes": ["Filme", "Player de Vídeo"]
                },
                {
                    "title": "Exibição de Legendas",
                    "input": "seleção de exibição da legenda em português ou em outro idioma",
                    "output": "exibição da legenda no player de vídeo",
                    "type": "internal",
                    "related_classes": ["Filme", "Legenda"]
                }
            ]
        }
        **Fim do exemplo**

        IMPORTANTE: Gere apenas interfaces que AINDA NÃO EXISTEM na lista fornecida. Se nenhuma nova interface for encontrada, retorne um array "system_interfaces" vazio.
        IMPORTANTE: Baseie-se exclusivamente no contexto fornecido. Retorne apenas o JSON.
        IMPORTANTE: Gere o mínimo de artefatos, foque nas principais que refletem bem o núcleo do projeto.
        PROMPT;
    }

    private function parseResponse(string $content): array
    {
        try {
            $cleanedContent = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $content);
            $data = json_decode(trim($cleanedContent), true, 512, JSON_THROW_ON_ERROR);
            if (!isset($data['system_interfaces']) || !is_array($data['system_interfaces'])) {
                throw new \Exception("A resposta da IA não contém um array 'system_interfaces' válido.");
            }
            return $data;
        } catch (\Exception $e) {
            Log::error("Erro no parser da IA para Interfaces de Sistema: " . $e->getMessage());
            throw $e;
        }
    }
}