<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ToolController extends Controller
{
    /**
     * Busca dados de artefatos para o agente de IA.
     */
    public function getArtifactData(Request $request)
    {
        Log::info('Serviço Python (Agente) chamou a ferramenta getArtifactData', [
            'data' => $request->all(),
            'ip' => $request->ip()
        ]); 
        
        $validated = $request->validate([
            'project_id' => 'required|integer|exists:projects,id',
            'artifact_name' => 'required|string',
        ]);

        $project = Project::find($validated['project_id']);
        $artifact = $validated['artifact_name'];

        $data = null;
        
        switch (strtolower($artifact)) {
            // --- INCEPTION ---
            case 'product canvas':
            case 'productCanvas':
            case 'product_canvas':
                $data = $project->productCanvas()->first();
                break;
            case 'goals':
            case 'goal sketch':
            case 'goalSketch':
            case 'goal_sketch':
                $data = $project->goals()->get();
                break;
            case 'personas':
                $data = $project->personas()->get();
                break;
            case 'journeys':
            case 'user journeys':
                $data = $project->journeys()->get();
                break;
            
            // --- STORY DISCOVERY ---
            case 'stories':
            case 'user stories':
            case 'system stories':
            case 'userStories':
            case 'systemStories':
            case 'user_stories':
            case 'system_stories':
                $data = $project->stories()->get();
                break;
            case 'overall model':
            case 'crc cards':
            case 'overallModel':
            case 'crcCards':
            case 'overall_model':
            case 'crc_cards':
                $data = $project->overallModelClasses()->get();
                break;
            case 'prioritization':
            case 'matriz de priorização':
            case 'matriz_de_priorização':
            case 'matrizPriorização':
                // Você pode querer buscar a priorização ativa ou todas
                $data = $project->prioritizations()->with('matrix')->get();
                break;

            // --- REFINING ---
            case 'business rules':
            case 'regras de negócio':
            case 'businessRules':
            case 'regrasDeNegócio':
            case 'business_rules':
            case 'regras_de_negócio':
                $data = $project->businessRules()->get();
                break;
            case 'usage scenarios':
            case 'cenários de uso':
            case 'usageScenarios':
            case 'cenáriosDeUso':
            case 'usage_scenarios':
            case 'cenários_de_uso':
                $data = $project->usageScenarios()->get();
                break;

            // --- MODELING ---
            case 'interfaces':
            case 'system interfaces':
            case 'systemInterfaces':
            case 'system_interfaces':
                $data = $project->systemInterfaces()->get();
                break;
            case 'storyboards':
            case 'prototypes':
                $data = $project->storyboards()->get();
                break;

            // --- SPRINT ---
            case 'sprints':
                $data = $project->sprints()->with('stories')->get();
                break;
            case 'product backlog':
            case 'productBacklog':
            case 'product_backlog':
                // Retorna histórias que não estão em nenhum sprint
                $data = $project->stories()->doesntHave('sprints')->get();
                break;
                
            default:
                Log::warning("Artefato '$artifact' não conhecido pela ToolController.");
                return response()->json(['error' => "Artefato '$artifact' não conhecido."], 404);
        }

        Log::info('Retornando dados para a ferramenta do Agente', [
            'project_id' => $validated['project_id'],
            'artifact' => $validated['artifact_name'],
            'data_count' => is_countable($data) ? count($data) : ($data ? 1 : 0)
        ]);

        return response()->json($data);
    }
}