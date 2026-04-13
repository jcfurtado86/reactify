<?php

namespace App\Http\Controllers;

use App\Services\AI\GeminiGeneratorService;
use App\Services\AI\Strategies\OverallModelStrategy;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\GenerateArtifactRequest;

class OverallModelGeneratorControllerGemini extends Controller
{
    public function __construct(private GeminiGeneratorService $generator) {}

    public function generate(GenerateArtifactRequest $request): JsonResponse
    {
        return $this->generator->generate(new OverallModelStrategy(), $request);
    }
}
