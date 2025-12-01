<?php

namespace App\Http\Controllers;

use App\Models\Sprint;
use App\Models\Story;
use App\Models\StorySprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class StorySprintController extends Controller
{
  /**
   * Adicionar stories à sprint
   */
  public function store(Request $request, Sprint $sprint)
  {
    $validated = $request->validate([
      'story_ids' => 'required|array',
      'story_ids.*' => 'exists:stories,id',
    ]);

    $storyIds = $validated['story_ids'];
    $targetSprintId = $sprint->id;

    try {
      DB::transaction(function () use ($storyIds, $sprint, $targetSprintId) {
        $pivotTable = $sprint->stories()->getTable();

        DB::table($pivotTable)
          ->whereIn('story_id', $storyIds) // Para as stories que estamos movendo
          ->where('sprint_id', '!=', $targetSprintId) // De qualquer sprint que NÃO seja a nossa
          ->delete();

        $dataToSync = collect($storyIds)
          ->mapWithKeys(function ($id) {
            return [
              $id => [
                'kanban_status' => 'todo',
                'position' => 0,
              ],
            ];
          })
          ->all();

        $sprint->stories()->syncWithoutDetaching($dataToSync);

        Story::whereIn('id', $storyIds)->update([
          'status' => 'in_progress',
        ]);
      });

      Log::info("Stories movidas para a sprint {$sprint->id}", [
        'stories' => $storyIds,
      ]);
    } catch (\Exception $e) {
      Log::error("Falha ao mover stories para a sprint {$sprint->id}", [
        'error' => $e->getMessage(),
        'stories' => $storyIds,
      ]);

      return back()->with([
        'message' => 'Erro ao mover as stories.',
        'status' => 'error',
      ]);
    }

    return back()->with([
      'message' => 'Stories adicionadas à sprint com sucesso',
      'status' => 'success',
    ]);
  }

  /**
   * Remover story da sprint
   */
  public function destroy(Request $request, Sprint $sprint)
  {
    $validated = $request->validate([
      'story_ids' => 'required|array',
      'story_ids.*' => 'exists:stories,id',
    ]);

    $storyIds = $validated['story_ids'];
    $storiesLength = count($storyIds);
    DB::transaction(function () use ($sprint, $storyIds) {
      foreach ($storyIds as $storyId) {
        $sprint->stories()->detach($storyId);

        Story::where('id', $storyId)->update([
          'status' => 'prioritized',
        ]);

        Log::info("Story {$storyId} removed from sprint {$sprint->id}");
      }
    });


    Log::info("{$storiesLength} Stories removed from sprint {$sprint->id}");

    return back()->with([
      'message' => $storiesLength . ' ' . ($storiesLength > 1 ? 'Stories' : 'Story') . ' movidas ao Backlog movidas de ao Backlog',
      'status' => 'success',
    ]);
  }

  /**
   * Atualizar status/posição das stories
   */
  public function update(Request $request, Sprint $sprint)
  {
    $validated = $request->validate([
      'story_id' => 'required|exists:stories,id',
      'kanban_status' => 'required|in:todo,in_progress,testing,done',
      'position' => 'sometimes|integer|min:0',
    ]);

    $sprint->stories()->updateExistingPivot($validated['story_id'], [
      'kanban_status' => $validated['kanban_status'],
      'position' => $validated['position'] ?? 0,
    ]);

    if ($validated['kanban_status'] === 'done') {
      Story::where('id', $validated['story_id'])->update([
        'status' => 'done',
      ]);
    }

    Log::info("Story {$validated['story_id']} updated in sprint {$sprint->id}");

    return back()->with([
      'message' => 'Story atualizada com sucesso',
      'status' => 'success',
    ]);
  }
}
