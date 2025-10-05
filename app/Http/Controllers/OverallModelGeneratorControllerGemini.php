<?php

namespace App\Http\Controllers;

use App\Models\Story; // Importa o modelo Story
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Log;

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

            // 1. Buscar todas as User Stories e System Stories do projeto
            $stories = Story::where('project_id', $validated['project_id'])->get();

            if ($stories->isEmpty()) {
                return response()->json([
                    'status' => 'warning',
                    'message' => 'Nenhuma estória (User ou System Story) foi encontrada para servir de base para a geração do modelo.'
                ], 422);
            }

            $storyContext = $stories->map(function ($story) {
                return "- ({$story->type}): {$story->title}";
            })->implode("\n");

            $prompt = $this->createPrompt($storyContext);
            $modelName = config('gemini.model');
            $fullPrompt = 'Você é um especialista em engenharia de software e análise de requisitos.' . $prompt;

            $result = Gemini::generativeModel(model: $modelName)->generateContent($fullPrompt);
            $responseText = $result->text();

            $parsedData = $this->parseResponse($responseText);

            return response()->json([
                'status' => 'sucesso',
                'project_id' => $validated['project_id'],
                'crc_cards' => $parsedData['crc_cards'] ?? []
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao gerar Overall Model: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Ocorreu um erro no servidor ao gerar o Overall Model.'], 500);
        }
    }

    private function createPrompt(string $storyContext): string
    {
        return <<<PROMPT
        Analise a lista de User Stories e System Stories de um projeto fornecida abaixo. Sua tarefa é identificar as classes principais e modelá-las como CRC (Class-Responsibility-Collaborator) Cards.

        Estórias do Projeto:
        {$storyContext}

        Para cada classe que você identificar, defina:
        - 'class': O nome da classe (um substantivo, ex: "Filme", "Usuário").
        - 'responsabilities': Uma lista de ações que a classe deve executar (verbo + substantivo, ex: "Salvar informações", "Calcular nota").
        - 'collaborators': Uma lista de outras classes com as quais ela precisa interagir para cumprir suas responsabilidades.

        Formato de resposta requerido (JSON):
        {
            "crc_cards": [
                {
                    "class": "NomeDaClasse",
                    "responsabilities": ["Fazer algo", "Gerenciar aquilo"],
                    "collaborators": ["OutraClasse", "ServicoExterno"]
                }
            ]
        }

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
            ]
        }

        IMPORTANTE: Baseie-se exclusivamente nas estórias fornecidas. Retorne apenas o JSON.
        PROMPT;
    }

    private function parseResponse(string $content): array
    {
        try {
            $cleanedContent = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $content);
            $cleanedContent = trim($cleanedContent);
            $data = json_decode($cleanedContent, true, 512, JSON_THROW_ON_ERROR);
            if (!isset($data['crc_cards']) || !is_array($data['crc_cards'])) {
                throw new \Exception("A resposta da IA não contém um array 'crc_cards' válido.");
            }
            return $data;
        } catch (\Exception $e) {
            Log::error("Erro no parser da resposta da IA para CRC Cards: " . $e->getMessage());
            throw $e;
        }
    }
}