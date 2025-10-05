<?php

namespace App\Http\Controllers;

use App\Models\Story;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Log;

class BusinessRuleGeneratorControllerGemini extends Controller
{
    public function generate(Request $request, Story $story): JsonResponse
    {
        try {
            $validated = $request->validate([ 'project_id' => 'required|exists:projects,id' ]);

            $prompt = $this->createPrompt($story);
            $modelName = config('gemini.model');
            $fullPrompt = 'Você é um especialista em engenharia de software e análise de requisitos. ' . $prompt;
            
            $result = Gemini::generativeModel(model: $modelName)->generateContent($fullPrompt);
            $responseText = $result->text();
            $parsedData = $this->parseResponse($responseText);

            return response()->json([
                'status' => 'sucesso',
                'business_rules' => $parsedData['business_rules'] ?? []
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao gerar regras de negócio: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Erro ao processar a geração.'], 500);
        }
    }

    private function createPrompt(Story $story): string
    {
        return <<<PROMPT
        Analise a User Story a seguir e extraia as Regras de Negócio (Business Rules) que estão implícitas ou são necessárias para que a funcionalidade exista.

        User Story: "{$story->title}"

        Regras de negócio são declarações que restringem ou definem alguma parte do negócio.

        Formato de resposta requerido (JSON):
        {
            "business_rules": [
                { "title": "Descrição da primeira regra de negócio." },
                { "title": "Descrição da segunda regra de negócio." }
            ]
        }

        Exemplo aplicado a um projeto de streaming de filmes:
        Se a User Story for "Eu como Leon Cardoso quero uma seção no painel de controle administrativo que exibe estatísticas, gráficos ou tabelas de visitas à plataforma para consultar o fluxo de visitas à plataforma.", a resposta poderia ser:
        {
            "business_rules": [
                { "title": "A seção de estatísticas, gráficos ou tabelas de vistas deve estar disponível apenas no painel de controle administrativo, garantindo que apenas usuários autorizados, como administradores, tenham acesso a essas informações." },
                { "title": "As informações de visitas à plataforma devem ser protegidas e acessíveis apenas para usuários autorizados. É necessário garantir que os dados dos usuários sejam tratados de acordo com as leis de privacidade de dados aplicáveis e as políticas de segurança da empresa." },
                { "title": "As estatísticas, gráficos ou tabelas devem ser apresentados de forma clara e compreensível para os administradores." }
            ]
        }

        IMPORTANTE: Retorne apenas o JSON.
        PROMPT;
    }

    private function parseResponse(string $content): array
    {
        try {
            $cleanedContent = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $content);
            $data = json_decode(trim($cleanedContent), true, 512, JSON_THROW_ON_ERROR);
            if (!isset($data['business_rules']) || !is_array($data['business_rules'])) {
                throw new \Exception("A resposta da IA não contém 'business_rules'.");
            }
            return $data;
        } catch (\Exception $e) {
            Log::error("Erro no parser da IA para Regras de Negócio: " . $e->getMessage());
            throw $e;
        }
    }
}