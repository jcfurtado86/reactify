<?php

namespace App\Http\Controllers\Concerns;

use App\Enums\PermissionEnum;
use App\Http\Requests\GenerateArtifactRequest;
use App\Jobs\RunArtifactGenerationJob;
use App\Models\GenerationJob;
use App\Models\Project;
use App\Services\AI\BatchedGeneratorStrategy;
use App\Services\AI\GeneratorStrategy;
use App\Support\ProjectAccess;
use Illuminate\Http\JsonResponse;

/**
 * Compartilhado por todos os controllers de geração de artefato. Cada
 * controller fica reduzido a uma chamada `dispatchGeneration(...)` com
 * o type e a strategy do seu artefato.
 *
 * Faz validate → resolve project → checa pré-requisitos sync → cria
 * GenerationJob row → dispatch job → 202 Accepted.
 */
trait DispatchesArtifactGeneration
{
    protected function dispatchGeneration(
        string $type,
        GeneratorStrategy|BatchedGeneratorStrategy $strategy,
        GenerateArtifactRequest $request
    ): JsonResponse {
        $validated = $request->validated();

        $project = Project::find($validated['project_id']);
        if (!$project) {
            return response()->json([
                'status' => 'error',
                'message' => 'Projeto não encontrado.',
            ], 404);
        }

        $permission = $this->permissionForGenerationType($type);
        if ($permission && !ProjectAccess::can($request->user(), $project, $permission)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Seu papel no projeto não permite gerar este artefato.',
            ], 403);
        }

        $missing = $strategy->missingPrerequisites($project, $validated);
        if (!empty($missing)) {
            return response()->json([
                'status' => 'warning',
                'message' => 'Para gerar ' . $strategy->label()
                    . ', é necessário cadastrar ao menos um de cada item a seguir: '
                    . implode(', ', $missing) . '.',
                'itens_faltantes' => $missing,
            ], 422);
        }

        $job = GenerationJob::create([
            'project_id' => $project->id,
            'user_id' => $request->user()?->id,
            'type' => $type,
            'status' => 'queued',
            'input' => $validated,
        ]);

        RunArtifactGenerationJob::dispatch($job->id, get_class($strategy));

        return response()->json([
            'status' => 'queued',
            'generation_job_id' => $job->id,
            'message' => 'Geração na fila. Vai aparecer na tela quando ficar pronta.',
        ], 202);
    }

    private function permissionForGenerationType(string $type): ?PermissionEnum
    {
        return match ($type) {
            'personas'          => PermissionEnum::PERSONA_MANAGE,
            'stories'           => PermissionEnum::USER_STORY_MANAGE,
            'goals'             => PermissionEnum::GOAL_MANAGE,
            'journeys'          => PermissionEnum::JOURNEY_MANAGE,
            'business_rules'    => PermissionEnum::BUSINESS_RULE_MANAGE,
            'usage_scenarios'   => PermissionEnum::USAGE_SCENARIO_MANAGE,
            'overall_model'     => PermissionEnum::OVERALL_MODEL_MANAGE,
            'system_interfaces' => PermissionEnum::INTERFACE_MANAGE,
            'product_canvas'    => PermissionEnum::PRODUCT_CANVAS_MANAGE,
            'storyboards'       => PermissionEnum::STORYBOARD_MANAGE,
            default             => null,
        };
    }
}
