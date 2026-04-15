<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\DispatchesArtifactGeneration;
use App\Http\Requests\GenerateArtifactRequest;
use App\Services\AI\Strategies\JourneyStrategy;
use Illuminate\Http\JsonResponse;

class JourneyGeneratorController extends Controller
{
    use DispatchesArtifactGeneration;

    public function generateJourneys(GenerateArtifactRequest $request): JsonResponse
    {
        return $this->dispatchGeneration('journeys', new JourneyStrategy(), $request);
    }
}
