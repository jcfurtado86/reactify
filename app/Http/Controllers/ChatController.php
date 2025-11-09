<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\AIAssistantServiceGemini;
use App\Services\AIAssistantServiceOllama;
use App\Jobs\ProcessChatJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
  protected $aiAssistantService;

  public function __construct(AIAssistantServiceGemini $aiAssistantService)
  {
    $this->aiAssistantService = $aiAssistantService;
  }

  /**
   * Envia uma mensagem para o chat e obtém uma resposta da IA sem salvar o histórico.
   *
   * @param Request $request
   * @param Project $project
   * @return \Illuminate\Http\JsonResponse
   */
  public function store(Request $request, Project $project)
  {
    $validated = $request->validate([
      'message' => 'required|string|max:2000',
      'page_context' => 'required|array',
      'page_context.page' => 'required|string',
      'page_context.artifact' => 'required|string',
      'history' => 'present|array',
      //'context_data' => 'present|nullable|array'
    ]);

    $user = Auth::user();

    if (!$project->users()->where('user_id', $user->id)->exists()) {
      abort(403, 'Acesso negado');
      //return response()->json(['error' => 'Acesso negado'], 403);
    }

    ProcessChatJob::dispatch(
        $project, 
        $user, 
        $validated['page_context'], 
        $validated['history'], 
        $validated['message']
    );

    // Retorna uma resposta 202 (Accepted)
    return back();
  }
}
