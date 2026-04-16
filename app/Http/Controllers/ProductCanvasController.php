<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductCanvasRequest;
use App\Models\ProductCanvas;
use Illuminate\Support\Facades\Log;

class ProductCanvasController extends Controller
{
  public function update(ProductCanvasRequest $request, ProductCanvas $productCanvas)
  {
    $this->authorize('update', $productCanvas);
    $validated = $request->validated();

    $productCanvas->update($validated);

    return back();
  }
}
