<?php

namespace App\Http\Controllers;

use App\Services\AI\GeminiGeneratorService;
use App\Services\AI\Strategies\PersonaStrategy;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\GenerateArtifactRequest;

class PersonaGeneratorControllerGemini extends Controller
{
    public function __construct(private GeminiGeneratorService $generator) {}

    public function generatePersonas(GenerateArtifactRequest $request): JsonResponse
    {
        return $this->generator->generate(new PersonaStrategy(), $request);
    }
}
