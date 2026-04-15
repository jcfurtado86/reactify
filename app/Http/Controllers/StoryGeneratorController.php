<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\DispatchesArtifactGeneration;
use App\Http\Requests\GenerateArtifactRequest;
use App\Services\AI\Strategies\StoryStrategy;
use Illuminate\Http\JsonResponse;

class StoryGeneratorController extends Controller
{
    use DispatchesArtifactGeneration;

    public function generateStories(GenerateArtifactRequest $request): JsonResponse
    {
        return $this->dispatchGeneration('stories', new StoryStrategy(), $request);
    }
}
