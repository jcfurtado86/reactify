<?php

namespace App\Events;

use App\Models\Project;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel; 
use Illuminate\Contracts\Broadcasting\ShouldBroadcast; 
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatMessageReceived implements ShouldBroadcast 
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $project;
    public $user;
    public $message;

    /**
     * Create a new event instance.
     */
    public function __construct(Project $project, User $user, string $message)
    {
        $this->project = $project;
        $this->user = $user;
        $this->message = $message;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, 
     */
    public function broadcastOn(): array
    {
        // transmitir num canal privado 
        // apenas utilizadores autenticados podem ouvir
        return [
            new PrivateChannel('project.' . $this->project->id),
        ];
    }

    /**
     * O nome do evento que o Javascript vai ouvir.
     */
    public function broadcastAs(): string
    {
        return 'chat.message.received';
    }
}