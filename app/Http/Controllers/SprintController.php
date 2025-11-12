<?php

namespace App\Http\Controllers;

use App\Models\Sprint;
use App\Models\Story;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SprintController extends Controller
{
  public function index()
  {
    $sprints = Sprint::with([
      'stories' => function ($query) {
        $query->withPivot(['kanban_status', 'position']);
      },
    ])
      ->orderBy('start_date', 'desc')
      ->get();

    return back()->with([
      'sprints' => $sprints,
      'message' => 'Sprints loaded successfully',
      'status' => 'success',
    ]);
  }

  public function show(Sprint $sprint)
  {
    $sprint->load([
      'stories' => function ($query) {
        $query->withPivot(['kanban_status', 'position']);
      },
    ]);

    return back()->with([
      'sprint' => $sprint,
      'status' => 'success',
    ]);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'name' => 'required|string|max:255',
      'start_date' => 'required|date',
      'end_date' => 'required|date|after:start_date',
      'status' => 'required|in:active,completed',
      'project_id' => 'required|exists:projects,id',
    ]);

    $sprint = Sprint::create($validated);
    Log::info(
      'Sprint created successfully: ' . $sprint->id . ' - ' . $sprint->name
    );

    return back()->with([
      'message' => 'Sprint created successfully',
      'status' => 'success',
    ]);
  }

  public function update(Request $request, Sprint $sprint)
  {
    $validated = $request->validate([
      'name' => 'sometimes|string|max:255',
      'start_date' => 'sometimes|date|after_or_equal:yesterday',
      'end_date' => 'sometimes|date|after:start_date',
      'status' => 'sometimes|in:active,completed',
    ]);

    $sprint->update($validated);

    // Recarregar o projeto com relacionamentos
    $project = $sprint->project->load(['sprints.stories', 'stories']);

    return redirect()
      ->back()
      ->with([
        'message' => 'Sprint atualizada com sucesso!', // É bom enviar uma mensagem de sucesso
        'status' => 'success',
      ]);
  }

  public function finish(Request $request, Sprint $sprint)
  {
    $validated = $request->validate([
      'new_sprint_id' => 'required|exists:sprints,id',
    ]);

    $newSprintId = $validated['new_sprint_id'];

    if ($newSprintId == $sprint->id) {
      back()->with([
        'message' =>
          'Você não pode mover as stories para a mesma sprint que está finalizando.',
        'status' => 'error',
      ]);
    }
    try {
      $incompleteStories = $sprint
        ->stories()
        ->where('status', '!=', 'done')
        ->get();

      $incompleteStoryIds = $incompleteStories->pluck('id');
      $storyCount = $incompleteStoryIds->count();

      if ($storyCount > 0) {
        // 7. Encontra a nova sprint de destino
        $newSprint = Sprint::findOrFail($newSprintId);

        // 8. Prepara os novos dados da pivot (resetando o status)
        $storiesToSync = $incompleteStoryIds
          ->mapWithKeys(function ($id) {
            return [
              $id => [
                'kanban_status' => 'todo',
                'position' => 0,
              ],
            ];
          })
          ->all();

        // 9. MOVE as stories: Desanexa da sprint atual
        $sprint->stories()->detach($incompleteStoryIds);

        // 10. E anexa na nova sprint com os dados pivô resetados
        $newSprint->stories()->attach($storiesToSync);

        $sprint->update(['status' => 'completed']);

        back()->with([
          'message' => 'Stories movidas com sucesso para a nova sprint!',
          'status' => 'success',
        ]);
      }
    } catch (\Exception $e) {
      Log::error("Falha ao finalizar a sprint {$sprint->id}", [
        'error' => $e->getMessage(),
      ]);

      return redirect()
        ->back()
        ->with([
          'message' => 'Ocorreu um erro ao finalizar a sprint.',
          'status' => 'error',
        ]);
    }
  }

  public function destroy(Sprint $sprint)
  {
    // Antes de deletar, retorna todas as stories para o product backlog
    $storyIds = $sprint->stories()->pluck('story_id');

    Story::whereIn('id', $storyIds)->update([
      'status' => 'prioritized',
    ]);

    $sprint->delete();

    return back()->with([
      'message' => 'Sprint deleted successfully',
      'status' => 'success',
    ]);
  }
}
