<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\DispatchesArtifactGeneration;
use App\Http\Requests\GenerateArtifactRequest;
use App\Services\AI\Strategies\ProductCanvasStrategy;
use Illuminate\Http\JsonResponse;

class ProductCanvasGeneratorController extends Controller
{
    use DispatchesArtifactGeneration;

    public function generate(GenerateArtifactRequest $request): JsonResponse
    {
        return $this->dispatchGeneration('product_canvas', new ProductCanvasStrategy(), $request);
    }
}
