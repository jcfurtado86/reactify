<?php

namespace App\Http\Controllers;

use App\Models\CrcCard;
use App\Models\Story;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Log;

class SystemInterfaceGeneratorControllerGemini extends Controller
{
    public function generate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'project_id' => 'required|integer|exists:projects,id',
            ]);

            // 1. Buscar o contexto: CRC Cards e Estórias do projeto
            $crcCards = CrcCard::where('project_id', $validated['project_id'])->get();
            $stories = Story::where('project_id', $validated['project_id'])->get();

            if ($crcCards->isEmpty() || $stories->isEmpty()) {
                return response()->json([
                    'status' => 'warning',
                    'message' => 'É necessário ter ao menos um CRC Card e uma Estória cadastrados para gerar as interfaces.'
                ], 422);
            }

            // 2. Formatar o contexto para o prompt
            $context = "CRC Cards do Projeto:\n";
            foreach ($crcCards as $card) {
                $context .= "- Classe: {$card->class}, Colaboradores: " . implode(', ', json_decode($card->collaborators)) . "\n";
            }
            $context .= "\nEstórias do Projeto:\n";
            foreach ($stories as $story) {
                $context .= "- {$story->title}\n";
            }

            // 3. Criar prompt, chamar a IA e fazer o parsing
            $prompt = $this->createPrompt($context);
            $modelName = config('gemini.model');
            $fullPrompt = 'Você é um Arquiteto de Sistemas especialista em design de integrações. ' . $prompt;

            $result = Gemini::generativeModel(model: $modelName)->generateContent($fullPrompt);
            $responseText = $result->text();
            $parsedData = $this->parseResponse($responseText);

            return response()->json([
                'status' => 'sucesso',
                'system_interfaces' => $parsedData['system_interfaces'] ?? []
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao gerar Interfaces de Sistema: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Ocorreu um erro no servidor ao gerar as interfaces.'], 500);
        }
    }

    private function createPrompt(string $context): string
    {
        return <<<PROMPT
        Analise o Overall Model (CRC Cards) e as Estórias de um projeto listados abaixo. Sua tarefa é identificar e definir as Interfaces de Sistema necessárias.

        Contexto do Projeto:
        {$context}

        Para cada interface, defina:
        - 'title': Um nome claro para a interface (ex: "API de Pagamento", "Serviço de Autenticação").
        - 'input': Os dados que a interface recebe (ex: "ID do usuário, senha").
        - 'output': Os dados que a interface retorna (ex: "Token de acesso, dados do usuário").
        - 'type': O tipo de interface:
            - "external": Se a comunicação é com um sistema fora da aplicação (ex: API de terceiros, outro microserviço).
            - "internal": Se a comunicação é entre componentes principais dentro da mesma aplicação (ex: Módulo de Pedidos falando com Módulo de Estoque).

        Formato de resposta requerido (JSON):
        {
            "system_interfaces": [
                {
                    "title": "Nome da Interface",
                    "input": "Dados de entrada",
                    "output": "Dados de saída",
                    "type": "internal" | "external"
                }
            ]
        }

        Exemplo de resposta:
        {
            "system_interfaces": [
                {
                    "title": "Gateway de Pagamento",
                    "input": "Dados do cartão, valor da compra",
                    "output": "Status da transação (aprovada/recusada)",
                    "type": "external"
                },
                {
                    "title": "Serviço de Notificação por Email",
                    "input": "Email do destinatário, assunto, corpo da mensagem",
                    "output": "Status do envio (enviado/falhou)",
                    "type": "internal"
                }
            ]
        }

        IMPORTANTE: Baseie-se exclusivamente no contexto fornecido. Retorne apenas o JSON.
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