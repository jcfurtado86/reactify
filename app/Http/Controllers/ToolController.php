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
                $data = [
                    // Classes e Interfaces
                    'classes' => $project->overall_model_classes()
                        ->with('system_interfaces') 
                        ->get(),
                    
                    // Responsabilidades e Colaboradores
                    'crc_cards' => $project->crc_cards()->get() 
                ];
                break;
            case 'prioritizations':
                $data = [
                    // As colunas da matriz com as estórias já priorizadas
                    'matrix' => $project->matrix_priorities()
                        ->with('prioritizations.story')
                        ->orderBy('order_column')
                        ->get(),

                    // Estórias que NÃO estão na tabela de priorizações
                    'unprioritized' => $project->stories()
                        ->doesntHave('prioritization')
                        ->where('type', '!=', 'epic') // Opcional: geralmente épicas não são priorizadas diretamente
                        ->get()
                ];
                break;
            case 'change_requests':
                $data = $project->change_requests()
                    ->with(['requester', 'stories'])
                    ->get();
                break;

            // --- REFINING ---
            case 'epic_stories':
                $data = $project->stories()
                    ->whereNull('epic_id')
                    ->with('stories') 
                    ->get();
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
                // Se Storyboard tiver relacionamento com 'story', pode adicionar ->with('story')
                $data = $project->storyboards()->get();
                break;

            // --- SPRINT ---
            case 'sprint':
                // Definimos os campos com o prefixo 'stories.' para evitar ambiguidade
                $storyFields = [
                    'stories.id', 
                    'stories.title', 
                    'stories.invest_card', 
                    'stories.value', 
                    'stories.complexity', 
                    'stories.epic_id', 
                    'stories.type'
                ];

                $data = $project->sprints()
                    ->select(['id', 'name', 'start_date', 'end_date', 'status'])
                    ->where('status', 'active') 
                    ->with(['stories' => function($query) use ($storyFields) {
                        // Usamos a lista com prefixos aqui
                        $query->select($storyFields);
                    }])
                    ->get();  // Se é normal ter sprints paralelas, mude para get(). Caso contrario, usar first()
                break;
            // --- PRODUCT BACKLOG ---
            case 'product_backlog':
                $storyFields = ['id', 'title', 'invest_card', 'value', 'complexity', 'epic_id', 'type'];

                $data = $project->stories()
                    ->select($storyFields)
                    ->where('type', '!=', 'epic')
                    // Carrega as sprints para a IA saber onde a estória está
                    ->with(['sprints' => function($query) {
                        // CORREÇÃO: Adicionado o prefixo 'sprints.' para evitar ambiguidade com a tabela pivô
                        $query->select([
                            'sprints.id', 
                            'sprints.name', 
                            'sprints.status', 
                            'sprints.start_date', 
                            'sprints.end_date'
                        ]);
                    }])
                    ->get();
                break;

            case 'interviews':
                $data = $project->interviews()
                    ->select(['id', 'file_name', 'resource_type', 'transcript', 'created_at'])
                    ->where('extraction_status', 'completed')
                    ->whereNotNull('transcript')
                    ->get();
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