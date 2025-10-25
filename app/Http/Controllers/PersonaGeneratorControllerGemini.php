<?php

namespace App\Http\Controllers;

use App\Models\Interview;
use App\Models\Persona;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class PersonaGeneratorControllerGemini extends Controller
{
    public function generatePersonas(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'project_id' => 'required|integer|exists:projects,id',
            ]);

            $interviews = Interview::where('project_id', $validated['project_id'])
                ->whereNotNull('transcript')
                ->where('transcript', '!=', '')
                ->latest()
                //->limit(5)    // Limita a 5
                ->get();

            if ($interviews->isEmpty()) {
                return response()->json([
                    'status' => 'warning',
                    'message' => 'Nenhuma entrevista com transcrição foi encontrada neste projeto para análise.'
                ], 422);
            }

            $existingPersonas = Persona::where('project_id', $validated['project_id'])
                ->whereNull('deleted_at')
                ->get();
            
            $existingPersonasContext = "Nenhuma.";
            if ($existingPersonas->isNotEmpty()) {
                $existingPersonasContext = $existingPersonas->map(function($persona) {
                    $personaString = "- Nome: {$persona->name} (ID: {$persona->id})\n";
                    $formatList = function(?array $items, string $label) {
                        $str = "  {$label}:\n";
                        if (!empty($items)) {
                            foreach ($items as $item) {
                                // Garante que $item seja uma string
                                $itemText = is_string($item) ? $item : json_encode($item);
                                $str .= "    - {$itemText}\n";
                            }
                        } else {
                            $str .= "    - (Não definido)\n";
                        }
                        return $str;
                    };

                    $personaString .= $formatList($persona->profile, 'Perfil');
                    $personaString .= $formatList($persona->expectations, 'Expectativas');
                    $personaString .= $formatList($persona->goals, 'Objetivos');
                    
                    return $personaString;

                })->implode("\n\n"); // Separador com linha dupla para clareza
            }

            $combinedTranscripts = $interviews->pluck('transcript')->implode("\n\n---\n\n");

            $prompt = $this->createPrompt($combinedTranscripts, $existingPersonasContext);
            $modelName = config('gemini.model');
            $fullPrompt = 'Você é um especialista em engenharia de software e análise de requisitos. ' . $prompt;
            Log::info("PROMPT PARA PERSONA MODEL: \n\n{$fullPrompt}:");
            $result = Gemini::generativeModel(model: $modelName)->generateContent($fullPrompt);
            $responseText = $result->text();

            $parsedData = $this->parseResponse($responseText);

            return response()->json([
                'status' => 'sucesso',
                'project_id' => $validated['project_id'],
                'personas' => $parsedData['personas'] ?? []
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao gerar personas a partir de múltiplas entrevistas: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Ocorreu um erro no servidor ao gerar as personas.'], 500);
        }
    }
    /**
     * Cria o prompt detalhado para o modelo Gemini.
     */
    private function createPrompt(string $transcript, string $existingPersonasContext): string
    {
        // A transcrição é escapada para evitar problemas se contiver caracteres especiais de JSON
        $escapedTranscript = json_encode($transcript);

        return <<<PROMPT
        Com base na transcrição da entrevista de usuário fornecida abaixo, analise o texto e crie 1 a 2 personas detalhadas.

        Transcrição da Entrevista:
        {$escapedTranscript}

        LISTA DE PERSONAS JÁ EXISTENTES (NÃO REPITA):
        {$existingPersonasContext}

        Sua tarefa é extrair informações do que foi dito na entrevista para preencher os seguintes campos para cada persona:
        - 'name': Crie um nome fictício que represente o perfil do entrevistado.
        - 'profile': Descreva quem é a persona (idade, profissão, hobbies, motivações, comportamentos) com base nas informações da transcrição.
        - 'expectations': Liste o que a persona declarou esperar de um produto ou serviço.
        - 'goals': Liste quais são os objetivos e necessidades que a persona quer alcançar, conforme mencionado na entrevista.

        Formato de resposta requerido (JSON):
        Inicio do formato requerido
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
        Fim do formato requerido

        Exemplo de resposta (use este formato como guia):
        {
            "personas": [
                {
                    "name": "Leon Cardoso, Administrador da plataforma",
                    "profile": [
                        "Tem 26 anos, formado em Ciência da Computação há dois anos.",
                        "Possui conhecimento técnico em administração de plataformas web.",
                        "Responsável pela manutenção e atualização da plataforma de streaming."
                    ],
                    "expectations": [
                        "Espera uma interface administrativa limpa e eficiente.",
                        "Deseja ferramentas de análise de dados para monitorar o uso da plataforma.",
                        "Busca funcionalidades que ajudem na gestão eficiente de conteúdo.",
                        "Garantir a segurança da plataforma."
                    ],
                    "goals": [
                        "Adicionar e categorizar filme no catálogo",
                        "Remover um filme do catálogo",
                        "Consultar o fluxo de visitas à plataforma.",
                        "Gerenciar as inscrições na plataforma."
                    ]
                },
                {
                    "name": "Thiago Guimarães, Usuário da plataforma",
                    "profile": [
                        "Tem 32 anos, formado em publicidade e propaganda.",
                        "É fã de cinema e busca aprofundar seu conhecimento sobre obras clássicas.",
                        "Prefere interfaces com poucas informações e de fácil navegação.",
                        "Gosta de interagir via redes sociais com outras pessoas interessadas em cinema."
                    ],
                    "expectations": [
                        "Espera encontrar facilmente filmes em domínio público legendados.",
                        "Deseja poder assistir filmes no navegador desktop e no smartphone.",
                        "Busca uma experiência livre de anúncios intrusivos.",
                        "Espera ter a opção de criar listas de reprodução e receber recomendações."
                    ],
                    "goals": [
                        "Assistir um filme",
                        "Escolher o idioma da legenda do filme",
                        "Escrever uma resenha ou comentário sobre um filme",
                        "Dar nota para um filme",
                        "Seguir outros usuários da plataforma",
                        "Compartilhar um filme ou resenha em redes sociais",
                        "Criar playlists de filmes",
                        "Fazer requisições de filmes a serem adicionados ao catálogo."
                    ]
                }
            ]
        }
        Fim do exemplo

        IMPORTANTE: Baseie-se **exclusivamente** no conteúdo da transcrição fornecida. Não invente informações.
        IMPORTANTE: Gere apenas personas que AINDA NÃO EXISTEM na lista fornecida. Se nenhuma nova persona for identificada, retorne um array "personas" vazio.
        IMPORTANTE: Retorne apenas o JSON. Não inclua texto adicional, explicações ou marcadores de código como \`\`\`json.
        PROMPT;
    }

    /**
     * Analisa e valida a resposta JSON da API Gemini.
     */
    private function parseResponse(string $content): array
    {
        try {
            $cleanedContent = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $content);
            $cleanedContent = trim($cleanedContent);

            $data = json_decode($cleanedContent, true, 512, JSON_THROW_ON_ERROR);

            if (!isset($data['personas']) || !is_array($data['personas'])) {
                throw new \Exception("A resposta da IA não contém um array 'personas' válido.");
            }

            return $data;

        } catch (\JsonException $e) {
            Log::error("Erro de parsing JSON da IA: " . $e->getMessage() . " | Conteúdo recebido: " . $content);
            throw new \Exception('Erro ao decodificar o JSON retornado pela IA: ' . $e->getMessage());
        } catch (\Exception $e) {
            Log::error("Erro no parser da resposta da IA: " . $e->getMessage());
            throw $e;
        }
    }
}