<?php

namespace App\Http\Controllers;

use App\Services\AI\GeminiGeneratorService;
use App\Services\AI\Strategies\JourneyStrategy;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\GenerateArtifactRequest;

class JourneyGeneratorControllerGemini extends Controller
{
    public function __construct(private GeminiGeneratorService $generator) {}

    public function generateJourneys(GenerateArtifactRequest $request): JsonResponse
    {
        return $this->generator->generateBatched(new JourneyStrategy(), $request);
    }
}
