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
            case 'product_canvas':
                $data = $project->product_canvas()->first();
                break;
            case 'goal_sketches':
                $data = $project->goal_sketches()->get();
                break;
            case 'personas':
                $data = $project->personas()->get();
                break;
            case 'journeys':
                $data = $project->journeys()->get();
                break;
            
            // --- STORY DISCOVERY ---
            case 'stories':
                $data = $project->stories()->get();
                break;
            case 'overall_model_classes':
                $data = $project->overall_model_classes()->get();
                break;
            case 'prioritizations':
                // Você pode querer buscar a priorização ativa ou todas
                $data = $project->prioritizations()->with('matrix')->get();
                break;
            case 'change_requests':
                // Eager loads o requerente e as histórias impactadas para contexto completo.
                $data = $project->change_requests()
                    ->with(['requester', 'stories'])
                    ->get();
                break;

            // --- REFINING ---
            case 'epicStories':
                $data = $project->stories()->get();
                break;
            case 'business_rules':
                $data = $project->business_rules()->get();
                break;
            case 'usage_scenarios':
                $data = $project->usage_scenarios()->get();
                break;

            // --- MODELING ---
            case 'system_interfaces':
                $data = $project->system_interfaces()->get();
                break;
            case 'storyboards':
                $data = $project->storyboards()->get();
                break;

            // --- SPRINT ---
            case 'sprint':
                $data = $project->sprints()->with('stories')->get();
                break;
            // --- PRODUCT BACKLOG ---
            case 'productBacklog':
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