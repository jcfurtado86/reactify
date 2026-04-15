<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\DispatchesArtifactGeneration;
use App\Http\Requests\GenerateArtifactRequest;
use App\Services\AI\Strategies\OverallModelStrategy;
use Illuminate\Http\JsonResponse;

class OverallModelGeneratorController extends Controller
{
    use DispatchesArtifactGeneration;

    public function generate(GenerateArtifactRequest $request): JsonResponse
    {
        return $this->dispatchGeneration('overall_model', new OverallModelStrategy(), $request);
    }
}
