<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMessage extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'project_id',
        'user_id',
        'sender',
        'message',
        'page_context',
        'feedback',
        'feedback_comment',
        'model_provider',
        'model_name',
        'latency_ms',
    ];

    protected $casts = [
        'page_context' => 'array',
        'created_at' => 'datetime',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
