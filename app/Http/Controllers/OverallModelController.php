<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CrcCard;
use Illuminate\Support\Facades\Log;
use App\Http\Requests\BulkStoreOverallModelRequest;
use Illuminate\Support\Facades\DB;
use App\Models\OverallModelClass;

class OverallModelController extends Controller
{
  public function bulk(BulkStoreOverallModelRequest $request)
  {
    $validatedData = $request->validated();

    DB::transaction(function () use ($validatedData) {
      foreach ($validatedData['crc_cards'] as $cardData) {
        // Garante que a classe principal exista no banco de classes
        OverallModelClass::firstOrCreate(
          ['project_id' => $cardData['project_id'], 'name' => $cardData['class']],
          ['project_id' => $cardData['project_id'], 'name' => $cardData['class']]
        );

        // O Model é CrcCard, mas os campos estão corretos.
        CrcCard::create($cardData);
      }
    });

    Log::info('Bulk CRC Cards created successfully', [
      'count' => count($validatedData['crc_cards']),
    ]);

    return back()->with('success', 'CRC Cards adicionados com sucesso.');
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'project_id' => 'required|exists:projects,id',
      'class' => 'required|string|max:30',
      'collaborators' => 'required|array',
      'collaborators.*' => 'required|string|max:30',
      'responsabilities' => 'required|array',
      'responsabilities.*' => 'required|string|max:40',
    ]);

    // Garante que a classe principal exista no banco de classes
    OverallModelClass::firstOrCreate(
      ['project_id' => $validated['project_id'], 'name' => $validated['class']],
      ['project_id' => $validated['project_id'], 'name' => $validated['class']]
    );

    CrcCard::create($validated);

    Log::info('OverallModel created', $validated);

    return back()->with([
      'status' => 'success',
      'message' => 'CRC Card created',
    ]);
  }

  public function update(Request $request, CrcCard $model)
  {
    $validated = $request->validate([
      'class' => 'nullable|string|max:30',
      'collaborators' => 'nullable|array',
      'collaborators.*' => 'nullable|string|max:30',
      'responsabilities' => 'nullable|array',
      'responsabilities.*' => 'nullable|string|max:40',
    ]);

    if ($request->has('class') && $request->class !== $model->class) {
      $newClassName = $validated['class'];
      $oldClassName = $model->class; // Captura o nome antigo ANTES do update
      $projectId = $model->project_id;

      // Tenta encontrar a classe no "Banco de Classes" com o nome ANTIGO
      $existingClass = OverallModelClass::where('project_id', $projectId)
        ->where('name', $oldClassName)
        ->first();

      if ($existingClass) {
        // Se encontrou, ATUALIZA o nome dela para o NOVO
        $existingClass->update(['name' => $newClassName]);
      } else {
        // Se não encontrou (caso raro), apenas cria a nova
        OverallModelClass::firstOrCreate(
          ['project_id' => $projectId, 'name' => $newClassName],
          ['project_id' => $projectId, 'name' => $newClassName]
        );
      }
    }

    $model->update($validated);

    Log::info('CRC Card updated', ['id' => $model->id]);

    return back()->with([
      'status' => 'success',
      'message' => 'CRC Card updated',
    ]);
  }

  public function destroy(CrcCard $model)
  {
    $model->delete();

    Log::warning('CRC Card deleted', ['id' => $model->id]);
    return back()->with([
      'status' => 'success',
      'message' => 'CRC Card deleted',
    ]);
  }
}
