<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SystemInterface;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\BulkStoreSystemInterfaceRequest;
use Illuminate\Support\Arr;

class SystemInterfaceController extends Controller
{
  public function bulk(BulkStoreSystemInterfaceRequest $request)
  {
    $validatedData = $request->validated();

    DB::transaction(function () use ($validatedData) {
      foreach ($validatedData['system_interfaces'] as $interfaceData) {
        $newInterface = SystemInterface::create([
          'title' => $interfaceData['title'],
          'input' => $interfaceData['input'],
          'output' => $interfaceData['output'],
          'type' => $interfaceData['type'],
          'project_id' => $interfaceData['project_id'],
        ]);

        if (!empty($interfaceData['overall_model_class_ids'])) {
          $newInterface
            ->overallModelClasses()
            ->sync($interfaceData['overall_model_class_ids']);
        }
      }
    });

    return back()->with([
      'message' => 'Interfaces criadas com sucesso',
      'status' => 'success',
    ]);
  }

  public function store(Request $request)
  {
    $validatedData = $request->validate([
      'title' => 'required|string|max:255',
      'input' => 'required|string|max:255',
      'output' => 'required|string|max:255',
      'type' => 'required|string|in:internal,external',
      'project_id' => 'required|integer|exists:projects,id',
      'overall_model_class_ids' => 'nullable|array',
      'overall_model_class_ids.*' =>
        'nullable|integer|exists:overall_model_classes,id',
    ]);

    $interface = DB::transaction(function () use ($validatedData) {
      $newInterface = SystemInterface::create([
        'title' => $validatedData['title'],
        'input' => $validatedData['input'],
        'output' => $validatedData['output'],
        'type' => $validatedData['type'],
        'project_id' => $validatedData['project_id'],
      ]);

      if (!empty($validatedData['overall_model_class_ids'])) {
        $newInterface
          ->overallModelClasses()
          ->sync($validatedData['overall_model_class_ids']);
      }
      return $newInterface;
    });

    if (!$interface) {
      return back()->with([
        'message' => 'Interface creation failed',
        'status' => 'error',
      ]);
    }

    return back()->with([
      'message' => 'Interface created successfully',
      'status' => 'success',
    ]);
  }

  public function update(Request $request, SystemInterface $interface)
  {
    $validatedData = $request->validate([
      'title' => 'nullable|string|max:255',
      'input' => 'nullable|string|max:255',
      'output' => 'nullable|string|max:255',
      'type' => 'nullable|string|in:internal,external',
      'overall_model_class_ids' => 'nullable|array',
      'overall_model_class_ids.*' =>
        'nullable|integer|exists:overall_model_classes,id',
    ]);

    $interfaceData = Arr::except($validatedData, ['overall_model_class_ids']);

    $interface->update($interfaceData);

    if (Arr::has($validatedData, 'overall_model_class_ids')) {
      $interface
        ->overallModelClasses()
        ->sync($validatedData['overall_model_class_ids']);
    }
    return back()->with([
      'message' => 'Interface updated successfully',
      'status' => 'success',
    ]);
  }

  public function destroy(SystemInterface $interface)
  {
    $interface->delete();
    return back()->with([
      'message' => 'Interface deleted successfully',
      'status' => 'success',
    ]);
  }
}
