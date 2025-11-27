<?php

namespace App\Http\Controllers;

use App\Models\Persona;
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

    $persona = Persona::create($validated);

    return back()->with(['status' => 'success', 'message' => 'Persona criada']);
  }

  public function update(Request $request, Persona $persona)
  {
    $validated = $request->validate([
      'name' => 'sometimes|string|max:255', // Opcional, se enviado, valida como string
      'profile' => 'nullable|array',
      'expectations' => 'nullable|array',
      'goals' => 'nullable|array',
      'invest_card' => 'nullable|array',
      'invest_card.independent' => 'nullable|string|in:yes,no,na',
      'invest_card.negotiable' => 'nullable|string|in:yes,no,na',
      'invest_card.valuable' => 'nullable|string|in:yes,no,na',
      'invest_card.estimable' => 'nullable|string|in:yes,no,na',
      'invest_card.small' => 'nullable|string|in:yes,no,na',
      'invest_card.testable' => 'nullable|string|in:yes,no,na',
    ]);

    $persona->update($validated);

    return back()->with(['status' => 'success', 'message' => 'Persona atualizada']);
  }

  /**
   * Remove uma persona.
   */
  public function destroy(Persona $persona)
  {
    $persona->delete();

    return back()->with(['status' => 'success', 'message' => 'Persona deletada.']);
  }
}
