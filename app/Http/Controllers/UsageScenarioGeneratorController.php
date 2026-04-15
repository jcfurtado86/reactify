<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\DispatchesArtifactGeneration;
use App\Http\Requests\GenerateArtifactRequest;
use App\Services\AI\Strategies\UsageScenarioStrategy;
use Illuminate\Http\JsonResponse;

class UsageScenarioGeneratorController extends Controller
{
    use DispatchesArtifactGeneration;

    public function generate(GenerateArtifactRequest $request): JsonResponse
    {
        return $this->dispatchGeneration('usage_scenarios', new UsageScenarioStrategy(), $request);
    }
}
