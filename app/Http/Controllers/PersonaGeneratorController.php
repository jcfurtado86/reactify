<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\DispatchesArtifactGeneration;
use App\Http\Requests\GenerateArtifactRequest;
use App\Services\AI\Strategies\PersonaStrategy;
use Illuminate\Http\JsonResponse;

class PersonaGeneratorController extends Controller
{
    use DispatchesArtifactGeneration;

    public function generatePersonas(GenerateArtifactRequest $request): JsonResponse
    {
        return $this->dispatchGeneration('personas', new PersonaStrategy(), $request);
    }
}
