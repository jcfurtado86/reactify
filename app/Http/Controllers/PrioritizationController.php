<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Goal;
use App\Models\Project;
use App\Models\Story;
use App\Models\Prioritization;

class PrioritizationController extends Controller
{
  public function store(Request $request)
  {
    $validatedData = $request->validate([
      'project_id' => 'required|exists:projects,id',
      'story_id' => 'required|exists:stories,id',
      'priority_id' => 'required|exists:matrix_priorities,id',
      'position' => 'required|integer',
    ]);

    $project = Project::findOrFail($validatedData['project_id']);
    $this->authorize('create', [Prioritization::class, $project]);

    $story = Story::find($validatedData['story_id']);

    if ($story->status !== 'draft') {
      return back()->with(['message' => 'Apenas estórias em draft podem ser priorizadas', 'status' => 'error']);
    }

    $goals = Goal::where('project_id', $project->id)->orderBy('id')->get();
    $goalAtPosition = $goals->values()->get($validatedData['position']);
    $validatedData['goal_id'] = $goalAtPosition?->id;

    $prioritization = Prioritization::create($validatedData);

    Story::where('id', $validatedData['story_id'])->update(['status' => 'prioritized']);

    return back()->with(['message' => 'Story successfully prioritized', 'status' => 'success']);
  }

  public function update(Request $request, Prioritization $prioritization)
  {
    $this->authorize('update', $prioritization);
    $validatedData = $request->validate([
      'priority_id' => 'required|exists:matrix_priorities,id',
      'position' => 'required|integer',
    ]);

    $story = $prioritization->story;

    if ($story->status !== 'prioritized') {
      return back()->with(['message' => 'Estórias presentes em sprints não podem ser movidas dentro da matriz ', 'status' => 'error']);
    }

    $goals = Goal::where('project_id', $prioritization->project_id)->orderBy('id')->get();
    $goalAtPosition = $goals->values()->get($validatedData['position']);
    $validatedData['goal_id'] = $goalAtPosition?->id;

    $prioritization->update($validatedData);

    return back()->with(['message' => 'Story priority updated successfully', 'status' => 'success']);
  }

  public function destroy(Prioritization $prioritization)
  {
    $this->authorize('delete', $prioritization);
    $story = $prioritization->story;

    if ($story->status !== 'prioritized') {
      return back()->with(['message' => 'Estórias presentes em sprints não podem ser removidas da matriz', 'status' => 'error']);
    }

    Story::where('id', $prioritization->story_id)->update(['status' => 'draft']);


    $prioritization->delete();


    return back()->with(['message' => 'Story successfully removed from matrix', 'status' => 'success']);
  }
}
