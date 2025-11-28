<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
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

    $story = Story::find($validatedData['story_id']);

    if ($story->status !== 'draft') {
      return back()->with(['message' => 'Only stories in draft status can be prioritized', 'status' => 'error']);
    }

    $prioritization = Prioritization::create($validatedData);

    Story::where('id', $validatedData['story_id'])->update(['status' => 'prioritized']);

    return back()->with(['message' => 'Story successfully prioritized', 'status' => 'success']);
  }

  public function update(Request $request, Prioritization $prioritization)
  {
    $validatedData = $request->validate([
      'priority_id' => 'required|exists:matrix_priorities,id',
      'position' => 'required|integer',
    ]);

    $story = $prioritization->story;

    if ($story->status !== 'draft') {
      return back()->with(['message' => 'Only stories in draft status can be prioritized', 'status' => 'error']);
    }

    $prioritization->update($validatedData);

    return back()->with(['message' => 'Story priority updated successfully', 'status' => 'success']);
  }

  public function destroy(Prioritization $prioritization)
  {
    Story::where('id', $prioritization->story_id)->update(['status' => 'draft']);

    $prioritization->delete();

    return back()->with(['message' => 'Story successfully removed from matrix', 'status' => 'success']);
  }
}
