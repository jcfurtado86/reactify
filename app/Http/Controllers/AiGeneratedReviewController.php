<?php

namespace App\Http\Controllers;

use App\Events\ProjectUpdated;
use App\Models\BusinessRule;
use App\Models\CrcCard;
use App\Models\Goal;
use App\Models\Journey;
use App\Models\OverallModelClass;
use App\Models\Persona;
use App\Models\ProductCanvas;
use App\Models\Project;
use App\Models\Story;
use App\Models\SystemInterface;
use App\Models\UsageScenario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Endpoints pra aprovar artefatos gerados pela IA. "Aprovar" = setar
 * is_ai_generated=false. "Descartar" usa os endpoints DELETE existentes
 * de cada artefato (não passa por aqui).
 */
class AiGeneratedReviewController extends Controller
{
    /**
     * Mapa de type slug → Model class. Source of truth pra qual tabela
     * cada chamada de approve atinge.
     */
    private const TYPE_MAP = [
        'personas' => Persona::class,
        'goals' => Goal::class,
        'journeys' => Journey::class,
        'stories' => Story::class,
        'business_rules' => BusinessRule::class,
        'usage_scenarios' => UsageScenario::class,
        'system_interfaces' => SystemInterface::class,
        'overall_model_classes' => OverallModelClass::class,
        'crc_cards' => CrcCard::class,
        'product_canvas' => ProductCanvas::class,
    ];

    public function approve(string $type, int $id): JsonResponse
    {
        $modelClass = $this->resolveModel($type);
        if (!$modelClass) {
            return response()->json(['status' => 'error', 'message' => 'Tipo desconhecido.'], 400);
        }

        $row = $modelClass::find($id);
        if (!$row) {
            return response()->json(['status' => 'error', 'message' => 'Item não encontrado.'], 404);
        }

        $row->is_ai_generated = false;
        $row->save();

        // Notifica o frontend que o projeto mudou — useEcho refetcha tudo.
        if ($row->project_id) {
            $project = Project::find($row->project_id);
            if ($project) {
                broadcast(new ProjectUpdated($project));
            }
        }

        return response()->json(['status' => 'success']);
    }

    public function approveAll(Request $request, string $type, int $projectId): JsonResponse
    {
        $modelClass = $this->resolveModel($type);
        if (!$modelClass) {
            return response()->json(['status' => 'error', 'message' => 'Tipo desconhecido.'], 400);
        }

        $count = $modelClass::where('project_id', $projectId)
            ->where('is_ai_generated', true)
            ->update(['is_ai_generated' => false]);

        $project = Project::find($projectId);
        if ($project) {
            broadcast(new ProjectUpdated($project));
        }

        return response()->json([
            'status' => 'success',
            'approved_count' => $count,
        ]);
    }

    private function resolveModel(string $type): ?string
    {
        return self::TYPE_MAP[$type] ?? null;
    }
}
