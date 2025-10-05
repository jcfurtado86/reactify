<?php

namespace App\Http\Controllers;

use App\Models\EpicStory;
use Illuminate\Http\Request;
use App\Http\Requests\BulkStoreEpicStoryRequest;
use Illuminate\Support\Facades\DB;   

class EpicStoryController extends Controller
{
  public function bulk(BulkStoreEpicStoryRequest $request)
  {
      $validatedData = $request->validated();
      DB::transaction(function () use ($validatedData) {
          foreach ($validatedData['epic_stories'] as $epicData) {
              EpicStory::create($epicData);
          }
      });
      return back()->with('success', 'Estórias decompostas foram salvas com sucesso.');
  }
  
  public function store(Request $request)
  {
    $validated = $request->validate([
      'title' => 'required|string|max:255',
      'story_id' => 'required|exists:stories,id',
      'project_id' => 'required|exists:projects,id',
    ]);

    $story = EpicStory::create($validated);

    return back()->with(['status' => 'success', 'message' => 'Story created successfully']);
  }

  public function update(Request $request, EpicStory $story)
  {
    $validated = $request->validate([
      'title' => 'required|string|max:255',
    ]);

    $story->update($validated);

    return back()->with(['status' => 'success', 'message' => 'Story updated successfully']);
  }

  public function destroy(EpicStory $story)
  {
    $story->delete();

    return back()->with(['status' => 'success', 'message' => 'Story deleted successfully']);
  }
}
