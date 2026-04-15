<?php

namespace App\Jobs;

use App\Enums\ChatMessageSender;
use App\Models\ChatMessage;
use App\Models\Project;
use App\Models\User;
use App\Services\PythonChatBridge;
use App\Events\ChatMessageReceived;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessChatJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $project;
    public $user;
    public $pageContext;
    public $chatHistory;
    public $userMessage;

    public function __construct(Project $project, User $user, array $pageContext, array $chatHistory, string $userMessage)
    {
        $this->project = $project;
        $this->user = $user;
        $this->pageContext = $pageContext;
        $this->chatHistory = $chatHistory;
        $this->userMessage = $userMessage;
    }

    public function handle(PythonChatBridge $aiService): void
    {
        $startedAt = microtime(true);
        try {
            $fullResponse = $aiService->generateBlockingResponse(
                $this->project,
                $this->user,
                $this->pageContext,
                $this->chatHistory,
                $this->userMessage
            );

            if ($fullResponse) {
                $latencyMs = (int) ((microtime(true) - $startedAt) * 1000);

                ChatMessage::create([
                    'project_id' => $this->project->id,
                    'user_id' => $this->user->id,
                    'sender' => ChatMessageSender::MODEL,
                    'message' => $fullResponse,
                    'page_context' => $this->pageContext,
                    'model_provider' => config('services.llm.provider'),
                    'model_name' => config('services.llm.' . config('services.llm.provider') . '_model'),
                    'latency_ms' => $latencyMs,
                ]);

                ChatMessageReceived::dispatch($this->project, $this->user, $fullResponse);
            }
        } catch (\Exception $e) {
            Log::error('Erro no ProcessChatJob: ' . $e->getMessage());
            ChatMessageReceived::dispatch($this->project, $this->user, "Ocorreu um erro no assistente de IA: " . $e->getMessage());
        }
    }
}
