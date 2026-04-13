<?php

namespace App\Http\Controllers;

use App\Services\AI\GeminiGeneratorService;
use App\Services\AI\Strategies\BusinessRuleStrategy;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\GenerateArtifactRequest;

class BusinessRuleGeneratorControllerGemini extends Controller
{
    public function __construct(private GeminiGeneratorService $generator) {}

    public function generate(GenerateArtifactRequest $request): JsonResponse
    {
        return $this->generator->generateBatched(new BusinessRuleStrategy(), $request);
    }
}
