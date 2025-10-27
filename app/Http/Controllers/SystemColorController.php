<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SystemColor;

class SystemColorController extends Controller
{
  public function store(Request $request)
  {
    ds($request->all());
    $validatedData = $request->validate([
      'project_id' => 'required|exists:projects,id',
      'stories' => 'nullable|array',
      'stories.system' => 'nullable|string',
      'stories.user' => 'nullable|string',
      'goals' => 'nullable|array',
      'goals.business' => 'nullable|string',
      'goals.constraint' => 'nullable|string',
      'goals.low' => 'nullable|string',
      'goals.medium' => 'nullable|string',
      'goals.high' => 'nullable|string',
    ]);

    $systemColor = SystemColor::updateOrCreate(
      ['project_id' => $validatedData['project_id']],
      $validatedData
    );

    if ($systemColor) {
      return back()->with([
        'message' => 'System color created successfully',
        'status' => 'success',
      ]);
    } else {
      return back()->with([
        'message' => 'System color creation failed',
        'status' => 'error',
      ]);
    }
  }
}
