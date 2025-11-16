<?php

namespace App\Http\Controllers;

use App\Models\MatrixPriority;
use Illuminate\Http\Request;
use App\Events\ProjectUpdated;
use App\Models\Project;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Exception;
use Illuminate\Support\Facades\Log;

class MatrixPriorityController extends Controller
{
  public function store(Request $request)
  {
    $validatedData = $request->validate([
      'name'       => [
        'required',
        'string',
        'max:255',
        Rule::unique('matrix_priorities')->where(function ($query) use ($request) {
          return $query->where('project_id', $request->project_id);
        })
      ],
      'color'      => 'required|string|max:7',
      'project_id' => 'required|exists:projects,id',
    ]);

    try {
      $nextOrder = MatrixPriority::where('project_id', $validatedData['project_id'])->count();
      $validatedData['order_column'] = $nextOrder;
      $priority = MatrixPriority::create($validatedData);

      return back();
    } catch (Exception $e) {
      Log::error('Erro ao criar prioridade: ' . $e->getMessage());
      return back();
    }
  }

  public function update(Request $request, MatrixPriority $priority)
  {
    $validatedData = $request->validate([
      'name' => [
        'nullable',
        'string',
        'max:255',
        Rule::unique('matrix_priorities')->where(function ($query) use ($priority) {
          return $query->where('project_id', $priority->project_id);
        })->ignore($priority->id)
      ],
      'color' => 'required|string',
    ]);

    try {
      $priority->update($validatedData);

      return back();
    } catch (Exception $e) {
      Log::error('Erro ao atualizar prioridade: ' . $e->getMessage(), ['id' => $priority->id]);
      return back();
    }
  }

  public function destroy(MatrixPriority $priority)
  {
    try {
      $priority->delete();

      return back();
    } catch (Exception $e) {
      Log::error('Erro ao deletar prioridade: ' . $e->getMessage(), ['id' => $priority->id]);
      return back();
    }
  }

  public function reorder(Request $request)
  {
    try {
      $request->validate([
        'priorities' => 'required|array',
        'priorities.*.id' => 'required|exists:matrix_priorities,id',
        'priorities.*.order' => 'required|integer',
        'project_id' => 'required|exists:projects,id',
      ]);
      $project = Project::findOrFail($request->project_id);

      DB::transaction(function () use ($request) {
        foreach ($request->priorities as $priorityData) {
          MatrixPriority::where('id', $priorityData['id'])
            ->update(['order_column' => $priorityData['order']]);
        }
      });

      broadcast(new ProjectUpdated($project));

      return back();
    } catch (Exception $e) {
      Log::error('Erro ao reordenar prioridades: ' . $e->getMessage());
      return back();
    }
  }
}
