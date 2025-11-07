<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

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

        // Garante que o usuário (a IA, neste caso) só possa ver dados do projeto
        // (Embora a chave de API já nos proteja, é uma boa prática)

        $data = null;
        switch (strtolower($artifact)) {
            case 'personas':
                $data = $project->personas()->get();
                break;
            case 'goals':
            case 'goal sketch':
                $data = $project->goals()->get();
                break;
            case 'journeys':
                $data = $project->journeys()->get();
                break;
            case 'stories':
            case 'user stories':
                $data = $project->stories()->get();
                break;
            // Adicione outros 'cases' para todos os seus artefatos
            // ex: 'business rules', 'overall model', etc.
            default:
                return response()->json(['error' => "Artefato '$artifact' não conhecido."], 404);
        }

        Log::info('Retornando dados para a ferramenta do Agente', [
            'project_id' => $validated['project_id'],
            'artifact' => $validated['artifact_name'],
            'data_count' => is_countable($data) ? count($data) : 'N/A'
        ]);

        return response()->json($data);
    }
}