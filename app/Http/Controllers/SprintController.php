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
      'status' => 'sometimes|in:planning,active,completed',
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
      'start_date' => 'sometimes|date|after_or_equal:today',
      'end_date' => 'sometimes|date|after:start_date',
      'status' => 'sometimes|in:planning,active,completed',
    ]);

    $sprint->update($validated);

    // Recarregar o projeto com relacionamentos
    $project = $sprint->project->load(['sprints.stories', 'stories']);

    return redirect()
      ->back()
      ->with([
        'project' => $project,
      ]);
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
