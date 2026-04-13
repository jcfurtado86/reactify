<?php

namespace App\Http\Controllers;

use App\Services\AI\GeminiGeneratorService;
use App\Services\AI\Strategies\GoalStrategy;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\GenerateArtifactRequest;

class GoalGeneratorControllerGemini extends Controller
{
    public function __construct(private GeminiGeneratorService $generator) {}

    public function generateGoals(GenerateArtifactRequest $request): JsonResponse
    {
        return $this->generator->generate(new GoalStrategy(), $request);
    }
}
