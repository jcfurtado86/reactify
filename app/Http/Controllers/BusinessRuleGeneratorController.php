<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\DispatchesArtifactGeneration;
use App\Http\Requests\GenerateArtifactRequest;
use App\Services\AI\Strategies\BusinessRuleStrategy;
use Illuminate\Http\JsonResponse;

class BusinessRuleGeneratorController extends Controller
{
    use DispatchesArtifactGeneration;

    public function generate(GenerateArtifactRequest $request): JsonResponse
    {
        return $this->dispatchGeneration('business_rules', new BusinessRuleStrategy(), $request);
    }
}
