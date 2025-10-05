<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CrcCard;
use Illuminate\Support\Facades\Log;
use App\Http\Requests\BulkStoreOverallModelRequest;
use Illuminate\Support\Facades\DB;  

class OverallModelController extends Controller
{
  public function bulk(BulkStoreOverallModelRequest $request)
  {
      $validatedData = $request->validated();

      DB::transaction(function () use ($validatedData) {
          foreach ($validatedData['crc_cards'] as $cardData) {
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
      'class' => 'required|string|max:90',
      'collaborators' => 'required|array',
      'collaborators.*' => 'required|string|max:50',
      'responsabilities' => 'required|array',
      'responsabilities.*' => 'required|string|max:50',
    ]);

    CrcCard::create($validated);

    Log::info('OverallModel created', $validated);

    return back()->with([
      'status' => 'success',
      'message' => 'CRC Card created',
    ]);;
  }

  public function update(Request $request, CrcCard $model)
  {

    $validated = $request->validate([
      'class' => 'nullable|string|max:90',
      'collaborators' => 'nullable|array',
      'collaborators.*' => 'nullable|string|max:50',
      'responsabilities' => 'nullable|array',
      'responsabilities.*' => 'nullable|string|max:50',
    ]);

    $model->update($validated);

    Log::info('CRC Card updated', ['id' => $model->id]);

    return back()->with([
      'status' => 'success',
      'message' => 'CRC Card updated',
    ]);;
  }

  public function destroy(CrcCard $model)
  {
    $model->delete();

    Log::warning('CRC Card deleted', ['id' => $model->id]);
    return back()->with([
      'status' => 'success',
      'message' => 'CRC Card deleted',
    ]);;
  }
}
