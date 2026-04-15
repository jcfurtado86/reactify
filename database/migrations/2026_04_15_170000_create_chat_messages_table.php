<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabelas antigas dead code (chat_sessions + chat_messages com
        // chat_session_id) nunca foram usadas de verdade. Dropa antes
        // de recriar chat_messages com schema novo.
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_sessions');

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('sender', ['user', 'model']);
            $table->text('message');
            $table->jsonb('page_context')->nullable();
            $table->enum('feedback', ['up', 'down'])->nullable();
            $table->text('feedback_comment')->nullable();
            $table->string('model_provider')->nullable();
            $table->string('model_name')->nullable();
            $table->unsignedInteger('latency_ms')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['project_id', 'user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
    }
};
