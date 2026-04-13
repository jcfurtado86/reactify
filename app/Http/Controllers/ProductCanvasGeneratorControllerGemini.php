<?php

namespace App\Http\Controllers;

use App\Services\AI\GeminiGeneratorService;
use App\Services\AI\Strategies\ProductCanvasStrategy;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\GenerateArtifactRequest;

class ProductCanvasGeneratorControllerGemini extends Controller
{
    public function __construct(private GeminiGeneratorService $generator) {}

    public function generate(GenerateArtifactRequest $request): JsonResponse
    {
        return $this->generator->generate(new ProductCanvasStrategy(), $request);
    }
}
