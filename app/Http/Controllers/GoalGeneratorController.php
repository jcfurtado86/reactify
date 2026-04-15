<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\DispatchesArtifactGeneration;
use App\Http\Requests\GenerateArtifactRequest;
use App\Services\AI\Strategies\GoalStrategy;
use Illuminate\Http\JsonResponse;

class GoalGeneratorController extends Controller
{
    use DispatchesArtifactGeneration;

    public function generateGoals(GenerateArtifactRequest $request): JsonResponse
    {
        return $this->dispatchGeneration('goals', new GoalStrategy(), $request);
    }
}
