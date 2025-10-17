<?php

namespace App\Http\Controllers;

use App\Models\Story;
use App\Http\Requests\StoreStoryRequest;
use App\Http\Requests\BulkStoreStoryRequest;
use App\Http\Requests\UpdateStoryRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StoryController extends Controller
{
  public function store(StoreStoryRequest $request)
  {
    $validated = $request->validated();
    $validated['invest_card'] = [
      'independent' => 'no',
      'negotiable' => 'no',
      'valuable' => 'no',
      'estimable' => 'no',
      'small' => 'no',
      'testable' => 'no',
    ];
    Story::create($validated);

    Log::info('Story created');
    return back()->with([
      'message' => 'Story created successfully',
      'status' => 'success',
    ]);
  }

  public function bulk(BulkStoreStoryRequest $request)
  {
    $validated = $request->validated();

    Log::warning('Bulk Story created', $validated['stories']);

    DB::transaction(function () use ($validated) {
      foreach ($validated['stories'] as $story) {
        $story['invest_card'] = [
          'independent' => 'no',
          'negotiable' => 'no',
          'valuable' => 'no',
          'estimable' => 'no',
          'small' => 'no',
          'testable' => 'no',
        ];
        Story::create($story);
      }
    });

    Log::info('Bulk Story created', $validated['stories']);

    return back();
  }

  public function update(UpdateStoryRequest $request, Story $story)
  {
    $validated = $request->validated();

    $story->update($validated);

    Log::info('Story updated', ['id' => $story->id]);

    return back();
  }

  public function prioritize(Request $request, Story $story)
  {
    $validated = $request->validate([
      'value' => 'nullable|integer',
      'complexity' => 'nullable|string|max:255',
    ]);

    $story->update($validated);

    return back()->with([
      'status' => 'success',
      'message' => 'Story prioritized successfully',
    ]);
  }

  public function addToSprint(Request $request, Story $story)
  {
    $validated = $request->validate([
      'sprint_id' => 'required|exists:sprints,id',
      'kanban_status' => 'sometimes|in:todo,in_progress,review,done',
      'position' => 'sometimes|integer|min:0',
    ]);

    $story->sprints()->attach($validated['sprint_id'], [
      'kanban_status' => $validated['kanban_status'] ?? 'todo',
      'position' => $validated['position'] ?? 0,
    ]);

    return back()->with([
      'status' => 'success',
      'message' => 'Story added to sprint',
    ]);
  }

  public function removeFromSprint(Story $story, $sprintId)
  {
    $story->sprints()->detach($sprintId);
    return back()->with([
      'status' => 'success',
      'message' => 'Story removed from sprint',
    ]);
  }

  public function updateKanbanStatus(Request $request, Story $story, $sprintId)
  {
    $validated = $request->validate([
      'kanban_status' => 'required|in:todo,in_progress,review,done',
      'position' => 'sometimes|integer|min:0',
    ]);

    $story->sprints()->updateExistingPivot($sprintId, $validated);

    return back()->with([
      'status' => 'success',
      'message' => 'Kanban status updated',
    ]);
  }

  public function destroy(Story $story)
  {
    $story->delete();

    Log::warning('Story deleted', ['id' => $story->id]);
    return back();
  }
}
