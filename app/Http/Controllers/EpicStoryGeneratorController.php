<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\DispatchesArtifactGeneration;
use App\Http\Requests\GenerateArtifactRequest;
use App\Services\AI\Strategies\EpicStoryStrategy;
use Illuminate\Http\JsonResponse;

class EpicStoryGeneratorController extends Controller
{
    use DispatchesArtifactGeneration;

    public function generate(GenerateArtifactRequest $request): JsonResponse
    {
        return $this->dispatchGeneration('epic_stories', new EpicStoryStrategy(), $request);
    }
}
