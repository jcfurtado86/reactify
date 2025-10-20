<?php

namespace App\Http\Controllers;

use App\Models\BusinessRule;
use Illuminate\Http\Request;
use App\Http\Requests\BulkStoreBusinessRuleRequest;
use Illuminate\Support\Facades\DB;

class BusinessRuleController extends Controller
{
  public function bulk(BulkStoreBusinessRuleRequest $request)
  {
    $validatedData = $request->validated();
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

    $story = BusinessRule::create($validated);

    return back()->with([
      'status' => 'success',
      'message' => 'Business Rule created successfully',
    ]);
  }

  public function update(Request $request, BusinessRule $rule)
  {
    $validated = $request->validate([
      'title' => 'nullable|string|max:255',
      'invest_card' => 'nullable|array',
      'invest_card.independent' => 'nullable|string|in:yes,no,na',
      'invest_card.negotiable' => 'nullable|string|in:yes,no,na',
      'invest_card.valuable' => 'nullable|string|in:yes,no,na',
      'invest_card.estimable' => 'nullable|string|in:yes,no,na',
      'invest_card.small' => 'nullable|string|in:yes,no,na',
      'invest_card.testable' => 'nullable|string|in:yes,no,na',
    ]);

    $rule->update($validated);

    return back()->with([
      'status' => 'success',
      'message' => 'Business Rule updated successfully',
    ]);
  }

  public function destroy(BusinessRule $rule)
  {
    $rule->delete();

    return back()->with([
      'status' => 'success',
      'message' => 'Business Rule deleted successfully',
    ]);
  }
}
