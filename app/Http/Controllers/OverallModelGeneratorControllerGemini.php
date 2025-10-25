<?php

namespace App\Http\Controllers;

use App\Models\Story;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Log;
use App\Models\Interview;
use App\Models\CrcCard; 
use App\Models\OverallModelClass; 

class OverallModelGeneratorControllerGemini extends Controller
{
    /**
     * Gera um Overall Model (CRC Cards) com base nas User Stories e System Stories do projeto.
     */
    public function generate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'project_id' => 'required|integer|exists:projects,id',
            ]);
            $projectId = $validated['project_id'];

            // 1. Buscar todas as User Stories e System Stories do projeto
            $stories = Story::where('project_id', $validated['project_id'])->get();
            $interviews = Interview::where('project_id', $projectId)
                ->whereNotNull('transcript')
                ->where('transcript', '!=', '')
                ->get();

            if ($stories->isEmpty()) {
                return response()->json([
                    'status' => 'warning',
                    'message' => 'Nenhuma estória (User ou System Story) foi encontrada para servir de base para a geração do modelo.'
                ], 422);
            }
            if ($interviews->isEmpty()) {
                return response()->json(['status' => 'warning', 'message' => 'Nenhuma entrevista foi encontrada para dar contexto.'], 422);
            }

            $existingCrcCards = CrcCard::where('project_id', $projectId)->get();
            $existingClasses = OverallModelClass::where('project_id', $projectId)->get();

            $existingCrcContext = "Nenhum CRC Card.";
            if ($existingCrcCards->isNotEmpty()) {
                $existingCrcContext = $existingCrcCards->map(function($card) {
                     $collab = is_string($card->collaborators) ? json_decode($card->collaborators) : $card->collaborators;
                     $collabStr = is_array($collab) ? implode(', ', $collab) : '';
                     return "- Classe: {$card->class} (Colaboradores: {$collabStr})";
                })->implode("\n");
            }

            $existingClassesContext = "Nenhuma Classe.";
            if ($existingClasses->isNotEmpty()) {
                $existingClassesContext = $existingClasses->map(fn($class) => "- {$class->name}")->implode("\n");
            }

            $storyContext = $stories->map(fn($story) => "- ({$story->type}): {$story->title}")->implode("\n");
            $combinedTranscripts = $interviews->pluck('transcript')->implode("\n\n---\n\n");
            $prompt = $this->createPrompt($storyContext, $combinedTranscripts, $existingCrcContext, $existingClassesContext);
            Log::info("PROMPT PARA OVERALL MODEL: \n\n{$prompt}:");
            $modelName = config('gemini.model');
            $fullPrompt = 'Você é um especialista em engenharia de software e análise de requisitos.' . $prompt;

            $result = Gemini::generativeModel(model: $modelName)->generateContent($fullPrompt);
            $responseText = $result->text();

            $parsedData = $this->parseResponse($responseText);

            return response()->json([
                'status' => 'sucesso',
                'crc_cards' => $parsedData['crc_cards'] ?? [],
                'overall_model_classes' => $parsedData['overall_model_classes'] ?? [],
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao gerar Overall Model: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Ocorreu um erro no servidor ao gerar o Overall Model.'], 500);
        }
    }

    private function createPrompt(string $storyContext, string $interviewContext, string $existingCrcContext, string $existingClassesContext): string
    {
        return <<<PROMPT
        Sua tarefa tem duas partes:
        1.  Analise a lista de estórias de um projeto e modele-as como CRC (Class-Responsibility-Collaborator) Cards.
        2.  Liste de forma única todas as classes que você identificou (tanto as classes principais quanto as colaboradoras).


        ESTÓRIAS DO PROJETO (Foco principal para classes e responsabilidades):
        {$storyContext}

        Contexto das entrevistas de requisitos do Projeto (Use como base de conhecimento):
        {$interviewContext}
        **Fim do contexto da entrevista**

        OVERAL MODEL EXISTENTE: 
        CRC Cards Atuais:
        {$existingCrcContext}
        Classes Atuais:
        {$existingClassesContext}

        Para cada **NOVA** classe que você identificar, defina:
        - 'class': O nome da classe (um substantivo, ex: "Filme", "Usuário").
        - 'responsabilities': Uma lista de ações que a classe deve executar (verbo + substantivo, ex: "Salvar informações", "Calcular nota").
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
                { "name": "Outra Classe" },
                { "name": "Servico Externo" }
            ]
        }
        **Fim do formato requerido**

        Exemplo de resposta:
        {
            "crc_cards": [
                {
                    "class": "Filme",
                    "responsabilities": ["Armazenar título e sinopse", "Obter média de avaliações", "Registrar novo comentário"],
                    "collaborators": ["Avaliacao", "Comentario"]
                },
                {
                    "class": "Usuario",
                    "responsabilities": ["Autenticar login", "Manter perfil", "Criar playlist"],
                    "collaborators": ["Playlist"]
                },
                {
                    "class": "Playlist",
                    "responsabilities": ["Adicionar filme", "Remover filme", "Listar filmes"],
                    "collaborators": ["Filme"]
                }
            ],
            "overall_model_classes": [
                { "name": "Filme" },
                { "name": "Usuario" },
                { "name": "Playlist" },
                { "name": "Avaliacao" },
                { "name": "Comentario" }
            ]
        }
        **Fim do exemplo**

        IMPORTANTE: A lista 'overall_model_classes' deve conter todos os nomes de classes de forma única (novas + existentes).
        IMPORTANTE: A lista 'crc_cards' deve conter apenas as **NOVAS** classes identificadas.
        IMPORTANTE: Retorne apenas o JSON.
        IMPORTANTE: Não repita Classes ou CRC Cards em hipótese alguma.
        IMPORTANTE: Gere o mínimo de artefatos, foque nas principais que refletem bem o núcleo do projeto.
        PROMPT;
    }

    private function parseResponse(string $content): array
    {
        try {
            $cleanedContent = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $content);
            $data = json_decode(trim($cleanedContent), true, 512, JSON_THROW_ON_ERROR);
            if (!isset($data['crc_cards']) || !isset($data['overall_model_classes'])) {
                throw new \Exception("A resposta da IA não contém 'crc_cards' e 'overall_model_classes'.");
            }
            return $data;
        } catch (\Exception $e) {
            Log::error("Erro no parser da resposta da IA para CRC Cards: " . $e->getMessage());
            throw $e;
        }
    }
}