<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Sprint;
use App\Models\Story;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use DB;

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
      'name' => 'required|string|max:30',
      'start_date' => 'required|date',
      'end_date' => 'required|date|after:start_date',
      'status' => 'required|in:active,completed',
      'project_id' => 'required|exists:projects,id',
    ]);

    $project = Project::findOrFail($validated['project_id']);
    $this->authorize('create', [Sprint::class, $project]);

    $hasActive = Sprint::where('project_id', $project->id)
      ->where('status', 'active')
      ->exists();

    if ($hasActive && $validated['status'] === 'active') {
      return back()->withErrors([
        'status' => __('Já existe uma sprint ativa neste projeto. Finalize-a antes de criar outra.'),
      ]);
    }

    $overlapping = Sprint::where('project_id', $project->id)
      ->where('start_date', '<=', $validated['end_date'])
      ->where('end_date', '>=', $validated['start_date'])
      ->exists();

    if ($overlapping) {
      return back()->withErrors([
        'start_date' => __('As datas desta sprint conflitam com uma sprint existente.'),
      ]);
    }

    $sprint = Sprint::create($validated);
    Log::info("Sprint created successfully: {$sprint->id}  -  {$sprint->name}");

    return back()->with([
      'message' => 'Sprint created successfully',
      'status' => 'success',
    ]);
  }

  public function update(Request $request, Sprint $sprint)
  {
    $this->authorize('update', $sprint);
    $validated = $request->validate([
      'name' => 'sometimes|string|max:30',
      'start_date' => 'sometimes|date_format:Y-m-d|after_or_equal:today',
      'end_date' => 'sometimes|date_format:Y-m-d|after:start_date',
      'status' => 'sometimes|in:active,completed',
    ]);

    $newStart = $validated['start_date'] ?? $sprint->start_date;
    $newEnd = $validated['end_date'] ?? $sprint->end_date;

    $overlapping = Sprint::where('project_id', $sprint->project_id)
      ->where('id', '!=', $sprint->id)
      ->where('start_date', '<=', $newEnd)
      ->where('end_date', '>=', $newStart)
      ->exists();

    if ($overlapping) {
      return back()->withErrors([
        'start_date' => __('As datas desta sprint conflitam com uma sprint existente.'),
      ]);
    }

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
    $this->authorize('update', $sprint);
    $validated = $request->validate([
      'new_sprint_id' => 'present|nullable|exists:sprints,id',
    ]);

    $newSprintId = $validated['new_sprint_id'];

    if ($newSprintId == $sprint->id) {
      back()->with([
        'message' =>
        'Você não pode mover as stories para a mesma sprint que está finalizando.',
        'status' => 'error',
      ]);
    }
    $message = 'Sprint finalizada com sucesso!';
    $storyCount = 0;
    try {
      DB::transaction(function () use (
        $sprint,
        $newSprintId,
        &$message,
        &$storyCount
      ) {
        $incompleteStories = $sprint
          ->stories()
          ->wherePivot('kanban_status', '!=', 'done')
          ->get();

        $incompleteStoryIds = $incompleteStories->pluck('id');
        $storyCount = $incompleteStoryIds->count();

        if ($storyCount > 0) {
          $sprint->stories()->detach($incompleteStoryIds);

          if ($newSprintId !== null) {
            // CASO A: Mover para nova sprint
            $newSprint = Sprint::findOrFail($newSprintId);
            $storiesToSync = $incompleteStoryIds;

            $newSprint->stories()->attach($storiesToSync);

            $message = "Sprint finalizada! {$storyCount} stories foram movidas para {$newSprint->name}.";
          } else {
            // CASO B: Mover para o Backlog
            Story::whereIn('id', $incompleteStoryIds)->update([
              'status' => 'prioritized',
            ]);

            $message = "Sprint finalizada! {$storyCount} stories foram movidas para o Product Backlog.";
          }
        }

        $sprint->update(['status' => 'completed']);
      });
    } catch (\Exception $e) {
      Log::error("Falha ao finalizar a sprint {$sprint->id}", [
        'error' => $e->getMessage(),
      ]);
      return redirect()
        ->back()
        ->with([
          'message' => $message,
          'status' => 'error',
        ]);
    }
    return redirect()
      ->back()
      ->with([
        'message' => $message,
        'status' => 'success',
      ]);
  }

  public function destroy(Sprint $sprint)
  {
    $this->authorize('delete', $sprint);
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
