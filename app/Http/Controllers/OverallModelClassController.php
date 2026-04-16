<?php

namespace App\Http\Controllers;

use App\Models\OverallModelClass;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Requests\BulkStoreOverallModelClassRequest;
use Illuminate\Support\Facades\DB;

class OverallModelClassController extends Controller
{
  public function bulk(BulkStoreOverallModelClassRequest $request)
  {
      $validatedData = $request->validated();
      $project = Project::findOrFail($validatedData['classes'][0]['project_id']);
      $this->authorize('create', [OverallModelClass::class, $project]);
      DB::transaction(function () use ($validatedData) {
          foreach ($validatedData['classes'] as $classData) {
              OverallModelClass::create($classData);
          }
      });
      return back()->with('success', 'Classes adicionadas com sucesso.');
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'name' => 'required|string|max:30',
      'project_id' => 'required|exists:projects,id',
    ]);

    $project = Project::findOrFail($validated['project_id']);
    $this->authorize('create', [OverallModelClass::class, $project]);

    $class = OverallModelClass::create($validated);

    return back()->with(['status' => 'success', 'message' => 'Class created successfully']);
  }
  public function destroy(OverallModelClass $class)
  {
    $this->authorize('delete', $class);
    $class->delete();

    return back()->with(['status' => 'success', 'message' => 'Class deleted successfully']);
  }
}
