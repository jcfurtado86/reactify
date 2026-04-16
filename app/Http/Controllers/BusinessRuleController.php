<?php

namespace App\Http\Controllers;

use App\Models\BusinessRule;
use App\Models\Project;
use Illuminate\Http\Request;
use App\Http\Requests\BulkStoreBusinessRuleRequest;
use Illuminate\Support\Facades\DB;

class BusinessRuleController extends Controller
{
  public function bulk(BulkStoreBusinessRuleRequest $request)
  {
    $validatedData = $request->validated();
    $project = Project::findOrFail($validatedData['business_rules'][0]['project_id']);
    $this->authorize('create', [BusinessRule::class, $project]);
    DB::transaction(function () use ($validatedData) {
      foreach ($validatedData['business_rules'] as $ruleData) {
        BusinessRule::create($ruleData);
      }
    });
    return back()->with(
      'success',
      'Regras de negócio adicionadas com sucesso.'
    );
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'title' => 'required|string|max:255',
      'story_id' => 'required|exists:stories,id',
      'project_id' => 'required|exists:projects,id',
    ]);

    $project = Project::findOrFail($validated['project_id']);
    $this->authorize('create', [BusinessRule::class, $project]);

    $story = BusinessRule::create($validated);

    return back()->with([
      'status' => 'success',
      'message' => 'Business Rule created successfully',
    ]);
  }

  public function update(Request $request, BusinessRule $rule)
  {
    $this->authorize('update', $rule);
    $validated = $request->validate([
      'title' => 'nullable|string|max:255',
    ]);

    $rule->update($validated);

    return back()->with([
      'status' => 'success',
      'message' => 'Business Rule updated successfully',
    ]);
  }

  public function destroy(BusinessRule $rule)
  {
    $this->authorize('delete', $rule);
    $rule->delete();

    return back()->with([
      'status' => 'success',
      'message' => 'Business Rule deleted successfully',
    ]);
  }
}
