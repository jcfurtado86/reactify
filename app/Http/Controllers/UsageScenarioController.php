<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\UsageScenario;
use Illuminate\Http\Request;
use App\Http\Requests\BulkStoreUsageScenarioRequest;
use Illuminate\Support\Facades\DB;

class UsageScenarioController extends Controller
{
  public function bulk(BulkStoreUsageScenarioRequest $request)
  {
    $validatedData = $request->validated();
    $project = Project::findOrFail($validatedData['usage_scenarios'][0]['project_id']);
    $this->authorize('create', [UsageScenario::class, $project]);
    DB::transaction(function () use ($validatedData) {
      foreach ($validatedData['usage_scenarios'] as $scenarioData) {
        UsageScenario::create($scenarioData);
      }
    });
    return back()->with('success', 'Cenários de uso adicionados com sucesso.');
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'description' => 'required|array',
      'description.as' => 'required|string',
      'description.given' => 'required|string',
      'description.when' => 'required|string',
      'description.then_1' => 'required|string',
      'description.and' => 'nullable|string',
      'description.then_2' => 'nullable|string',
      'story_id' => 'required|exists:stories,id',
      'project_id' => 'required|exists:projects,id',
    ]);

    $project = Project::findOrFail($validated['project_id']);
    $this->authorize('create', [UsageScenario::class, $project]);

    $usageScenario = UsageScenario::create($validated);

    return back()->with([
      'status' => 'success',
      'message' => 'Usage scenario created successfully',
    ]);
  }

  public function update(Request $request, UsageScenario $scenario)
  {
    $this->authorize('update', $scenario);
    $validated = $request->validate([
      'description' => 'nullable|array',
      'description.as' => 'nullable|string',
      'description.given' => 'nullable|string',
      'description.when' => 'nullable|string',
      'description.then_1' => 'nullable|string',
      'description.and' => 'nullable|string',
      'description.then_2' => 'nullable|string',
    ]);

    $scenario->update($validated);

    return back()->with([
      'status' => 'success',
      'message' => 'Usage scenario updated successfully',
    ]);
  }

  public function destroy(UsageScenario $scenario)
  {
    $this->authorize('delete', $scenario);
    $scenario->delete();

    return back()->with([
      'status' => 'success',
      'message' => 'Usage scenario deleted successfully',
    ]);
  }
}
