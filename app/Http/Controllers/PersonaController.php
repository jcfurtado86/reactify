<?php

namespace App\Http\Controllers;

use App\Models\Persona;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Requests\BulkStorePersonaRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PersonaController extends Controller
{
  public function bulk(BulkStorePersonaRequest $request)
  {
    $validatedData = $request->validated();
    $project = Project::findOrFail($validatedData['personas'][0]['project_id']);
    $this->authorize('create', [Persona::class, $project]);

    DB::transaction(function () use ($validatedData) {
      foreach ($validatedData['personas'] as $personaData) {
        Persona::create($personaData);
      }
    });

    Log::info('Bulk personas created successfully', [
      'count' => count($validatedData['personas']),
    ]);

    return back()->with(['status' => 'success', 'message' => 'Personas adicionadas']);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'name' => 'required|string|max:255',
      'profile' => 'nullable|array',
      'expectations' => 'nullable|array',
      'goals' => 'nullable|array',
      'project_id' => 'required|exists:projects,id',
    ]);

    $project = Project::findOrFail($validated['project_id']);
    $this->authorize('create', [Persona::class, $project]);

    $persona = Persona::create($validated);

    return back()->with(['status' => 'success', 'message' => 'Persona criada']);
  }

  public function update(Request $request, Persona $persona)
  {
    $this->authorize('update', $persona);

    $validated = $request->validate([
      'name' => 'sometimes|string|max:255',
      'profile' => 'nullable|array',
      'expectations' => 'nullable|array',
      'goals' => 'nullable|array',
    ]);

    $persona->update($validated);

    return back()->with(['status' => 'success', 'message' => 'Persona atualizada']);
  }

  public function destroy(Persona $persona)
  {
    $this->authorize('delete', $persona);
    $persona->delete();

    return back()->with(['status' => 'success', 'message' => 'Persona deletada.']);
  }
}
