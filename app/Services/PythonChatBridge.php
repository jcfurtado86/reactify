<?php

namespace App\Services;

use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * HTTP bridge pro py_service de chat. Antes chamado `AIAssistantServiceGemini`,
 * nome que enganava: esta classe NÃO fala direto com o Gemini. Ela posta no
 * endpoint `/chat-stream` do py_service, que por sua vez chama o LLM escolhido
 * pelo env `LLM_PROVIDER` (Gemini, Claude ou Ollama) via `build_llm()` em
 * `py_service/llm_factory.py`. Flipar provider é só mudar o env var.
 */
class PythonChatBridge
{
    protected string $pythonServiceUrl;

    public function __construct()
    {
        $this->pythonServiceUrl = config('services.python_chat_service.url')
            ?: 'http://127.0.0.1:5002/chat-stream';

        if (!config('services.python_chat_service.url')) {
            Log::warning('PYTHON_CHAT_SERVICE_URL não definida, usando default 5002');
        }
    }

    /**
     * Envia o payload pro py_service e espera a resposta completa. Método
     * bloqueante — deve ser usado só dentro de jobs (ProcessChatJob).
     */
    public function generateBlockingResponse(
        Project $project,
        User $user,
        array $pageContext,
        array $chatHistory,
        string $userMessage
    ): string {
        $userRole = $project->users()->find($user->id)->pivot->role;

        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'pivot' => ['role' => ['value' => $userRole->value ?? null]],
        ];

        $projectData = [
            'id' => $project->id,
            'title' => $project->title,
            'status' => $project->status,
            'description' => $project->description,
        ];

        try {
            $response = Http::withOptions(['timeout' => 600])
                ->post($this->pythonServiceUrl, [
                    'project' => $projectData,
                    'user' => $userData,
                    'page_context' => $pageContext,
                    'history' => $chatHistory,
                    'message' => $userMessage,
                ]);

            if (!$response->successful()) {
                Log::error('PythonChatBridge: py_service retornou erro', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return "Erro: Não foi possível conectar ao serviço de IA. (Status: {$response->status()})";
            }

            return $response->body();
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('PythonChatBridge: conexão falhou', ['error' => $e->getMessage()]);
            return 'Erro crítico: O serviço de IA está offline. ' . $e->getMessage();
        } catch (\Exception $e) {
            Log::error('PythonChatBridge: erro desconhecido', ['error' => $e->getMessage()]);
            return 'Erro: ' . $e->getMessage();
        }
    }
}
