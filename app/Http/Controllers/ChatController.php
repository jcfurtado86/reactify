<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\Project;
use App\Jobs\ProcessChatJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:2000',
            'page_context' => 'required|array',
            'page_context.page' => 'required|string',
            'page_context.artifact' => 'nullable|string',
            'history' => 'present|array',
        ]);

        $user = Auth::user();

        if (!$project->users()->where('user_id', $user->id)->exists()) {
            abort(403, 'Acesso negado');
        }

        ChatMessage::create([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'sender' => 'user',
            'message' => $validated['message'],
            'page_context' => $validated['page_context'],
        ]);

        ProcessChatJob::dispatch(
            $project,
            $user,
            $validated['page_context'],
            $validated['history'],
            $validated['message']
        );

        return back();
    }

    public function history(Project $project)
    {
        $user = Auth::user();

        if (!$project->users()->where('user_id', $user->id)->exists()) {
            abort(403, 'Acesso negado');
        }

        $messages = ChatMessage::query()
            ->where('project_id', $project->id)
            ->where('user_id', $user->id)
            ->orderBy('created_at')
            ->limit(100)
            ->get(['id', 'sender', 'message', 'created_at', 'feedback']);

        return response()->json(['messages' => $messages]);
    }

    public function feedback(Request $request, ChatMessage $message)
    {
        $validated = $request->validate([
            'feedback' => 'nullable|in:up,down',
            'feedback_comment' => 'nullable|string|max:1000',
        ]);

        $user = Auth::user();
        if ($message->user_id !== $user->id) {
            abort(403);
        }

        $message->update($validated);

        return response()->json(['ok' => true]);
    }
}
