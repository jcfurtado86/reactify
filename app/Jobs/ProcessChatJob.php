<?php

namespace App\Jobs;

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

    /**
     * Create a new job instance.
     */
    public function __construct(Project $project, User $user, array $pageContext, array $chatHistory, string $userMessage)
    {
        $this->project = $project;
        $this->user = $user;
        $this->pageContext = $pageContext;
        $this->chatHistory = $chatHistory;
        $this->userMessage = $userMessage;
    }

    /**
     * Execute the job.
     */
    public function handle(PythonChatBridge $aiService): void
    {
        try {
            // Chamar o Python e ESPERAR 
            $fullResponse = $aiService->generateBlockingResponse(
                $this->project,
                $this->user,
                $this->pageContext,
                $this->chatHistory,
                $this->userMessage
            );

            // Quando o Python responde, enviamos o evento via WebSocket
            if ($fullResponse) {
                ChatMessageReceived::dispatch($this->project, $this->user, $fullResponse);
            }

        } catch (\Exception $e) {
            Log::error('Erro no ProcessChatJob: ' . $e->getMessage());
            ChatMessageReceived::dispatch($this->project, $this->user, "Ocorreu um erro no assistente de IA: " . $e->getMessage());
        }
    }
}