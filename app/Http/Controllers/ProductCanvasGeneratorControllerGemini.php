<?php

namespace App\Http\Controllers;

use App\Models\Interview;
use App\Models\ProductCanvas;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Log;

class ProductCanvasGeneratorControllerGemini extends Controller
{
    public function generate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'project_id' => 'required|integer|exists:projects,id',
            ]);

            $interviews = Interview::where('project_id', $validated['project_id'])
                ->whereNotNull('transcript')
                ->where('transcript', '!=', '')
                ->latest()
                //->limit(5)
                ->get();

            if ($interviews->isEmpty()) {
                return response()->json([
                    'status' => 'warning',
                    'message' => 'Nenhuma entrevista com transcrição foi encontrada para gerar o Product Canvas.'
                ], 422);
            }

            $existingCanvas = ProductCanvas::where('project_id', $validated['project_id'])
                ->whereNull('deleted_at') // Se houver soft delete
                ->first();

            $existingCanvasContext = "Nenhum canvas preenchido ainda.";
            if ($existingCanvas) {
                // Assumindo que o model armazena os valores como no exemplo do prompt
                // Se seu model armazena o JSON inteiro, ajuste esta lógica
                $existingCanvasData = [
                    "issues" => $existingCanvas->issues ?? "Não definido",
                    "solutions" => $existingCanvas->solutions ?? "Não definido",
                    "personas" => $existingCanvas->personas ?? "Não definido",
                    "restrictions" => $existingCanvas->restrictions ?? "Não definido",
                    "product_is" => $existingCanvas->product_is ?? "Não definido",
                    "product_is_not" => $existingCanvas->product_is_not ?? "Não definido",
                ];
                $existingCanvasContext = json_encode($existingCanvasData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            }

            $combinedTranscripts = $interviews->pluck('transcript')->implode("\n\n---\n\n");

            $prompt = $this->createPrompt($combinedTranscripts, $existingCanvasContext);
            $modelName = config('gemini.model');
            $fullPrompt = 'Você é um especialista em engenharia de software e análise de requisitos. ' . $prompt;
            Log::info("PROMPT PARA PRODUCT CANVAS: \n\n{$fullPrompt}:");
            $result = Gemini::generativeModel(model: $modelName)->generateContent($fullPrompt);
            $responseText = $result->text();
            $parsedData = $this->parseResponse($responseText);

            return response()->json([
                'status' => 'sucesso',
                'product_canvas' => $parsedData['product_canvas'] ?? []
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao gerar Product Canvas: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Ocorreu um erro no servidor ao gerar o Product Canvas.'], 500);
        }
    }

    private function createPrompt(string $transcripts, string $existingCanvasContext): string
    {
        return <<<PROMPT
        Sua tarefa é preencher um Product Canvas com base nas transcrições de entrevistas de usuários fornecidas.

        **Definição do Product Canvas**: O Product Canvas é um artefato para estabelecer uma visão de alto nível do produto pretendido. Ele ajuda a definir os problemas a serem solucionados, a solução proposta, os usuários-chave, as restrições, e o que o produto é e não é.

        **Transcrição das Entrevistas:**
        {$transcripts}

        **Product Canvas ATUAL (Use como base para refinar):**
        {$existingCanvasContext}

        Analise a transcrição e extraia as informações para preencher os seguintes campos. O valor de cada campo deve ser um texto conciso e principalmente direto e resumido, formatado com quebras de linha (`\n`) se necessário.
        - 'issues': Os problemas que serão solucionados com o produto.
        - 'solutions': A solução proposta para resolver esses problemas.
        - 'personas': As personas ou usuários-chave da solução.
        - 'restrictions': As restrições do produto, listando as limitações que a solução deve obedecer.
        - 'product_is': O que a solução ou produto será.
        - 'product_is_not': O que a solução ou produto não será.

        O formato de resposta requerido é um JSON com um array de objetos, onde cada objeto representa um campo do canvas.

        Formato de resposta requerido (JSON):
        {
            "product_canvas": [
                { "key": "issues", "label": "Problems", "value": "Texto extraído sobre os problemas..." },
                { "key": "solutions", "label": "Solutions", "value": "Texto extraído sobre as soluções..." },
                { "key": "personas", "label": "Personas", "value": "Texto extraído sobre as personas..." },
                { "key": "restrictions", "label": "Restrictions", "value": "Texto extraído sobre as restrições..." },
                { "key": "product_is", "label": "Product Is", "value": "Texto extraído sobre o que o produto é..." },
                { "key": "product_is_not", "label": "Product Is Not", "value": "Texto extraído sobre o que o produto não é..." }
            ]
        }
        
        Exemplo com base no projeto Classicflix:
        {
            "product_canvas": [
                { "key": "issues", "label": "Problems", "value": "Acesso difícil ou limitado a filmes em domínio público para fins educacionais ou de entretenimento.\\nAcesso difícil ou limitado a filmes em domínio público legendados em português.\\nDesinteresse de plataformas tradicionais de streaming em preservação histórica de filmes clássicos.\\nAs plataformas de streaming praticam preços de assinatura muito elevados." },
                { "key": "solutions", "label": "Solutions", "value": "Criar uma plataforma de streaming para filmes em domínio público, com legendas em português e preços de assinaturas acessíveis." },
                { "key": "personas", "label": "Personas", "value": "Leon Cardoso - Administrador da plataforma.\\nThiago Guimarães - Usuário." },
                { "key": "restrictions", "label": "Restrictions", "value": "A plataforma deve funcionar em qualquer navegador web baseado no Chromium, no Opera, no Safari e no Mozilla Firefox.\\nA plataforma deve exigir um cadastro do usuário.\\nA plataforma deve exigir uma assinatura semestral ou anual para acesso ilimitado ao catálogo." },
                { "key": "product_is", "label": "Product Is", "value": "É uma plataforma web.\\nÉ otimizada para navegadores desktop e mobile.\\nA plataforma oferece uma comunidade para interação entre usuários." },
                { "key": "product_is_not", "label": "Product Is Not", "value": "Não é um sistema desktop.\\nNão é um aplicativo móvel." }
            ]
        }

        IMPORTANTE: Baseie-se nas transcrições para **refinar o canvas atual**.
        IMPORTANTE: Retorne apenas o JSON.
        PROMPT;
    }

    private function parseResponse(string $content): array
    {
        try {
            $cleanedContent = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $content);
            $data = json_decode(trim($cleanedContent), true, 512, JSON_THROW_ON_ERROR);
            if (!isset($data['product_canvas']) || !is_array($data['product_canvas'])) {
                throw new \Exception("A resposta da IA não contém um array 'product_canvas' válido.");
            }
            return $data;
        } catch (\Exception $e) {
            Log::error("Erro no parser da IA para Product Canvas: " . $e->getMessage());
            throw $e;
        }
    }
}