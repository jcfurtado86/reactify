<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use OpenAI\Laravel\Facades\OpenAI;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Http\Requests\StoreStoryRequest;
use App\Services\StoryService;


class StoryGeneratorController extends Controller
{

  public function generateStories(Request $request): JsonResponse
  {
    try {
      // Validar se o project_id foi enviado PRIMEIRO
      $request->validate([
        'project_id' => 'required|integer|min:1'
      ]);

      $projectId = $request->input('project_id');

      // Buscar dados do banco de dados para contexto
      $personas = $this->getPersonasFromDatabase($projectId);
      $journeys = $this->getJourneysFromDatabase($projectId);
      $productConstraints = $this->getProductConstraintsFromDatabase($projectId);
      $constraintGoals = $this->getConstraintGoalsFromDatabase($projectId);

      // Verificar se há dados suficientes para gerar stories
      if (empty($personas) && empty($journeys) && empty($productConstraints) && empty($constraintGoals)) {
        return response()->json([
          'status' => 'error',
          'message' => 'Nenhum dado encontrado para este projeto. Certifique-se de que há personas, journeys ou constraints cadastrados.'
        ], 404);
      }

      // MODIFICADO: Prompt agora usa dados do banco em vez da entrevista
      $prompt = $this->createPrompt($personas, $journeys, $productConstraints, $constraintGoals);

      $result = OpenAI::chat()->create([
        'model' => 'gpt-4o-mini',
        'messages' => [
          ['role' => 'system', 'content' => 'Você é um especialista em engenharia de software e análise de requisitos'],
          ['role' => 'user', 'content' => $prompt],
        ],
      ]);

      $parsedResponse = $this->parseResponse($result->choices[0]->message->content);

      return response()->json([
        'status' => 'sucesso',
        //'project_id' => $projectId,
        'message' => $parsedResponse,
      ]);

    } catch (\Illuminate\Validation\ValidationException $e) {
      return response()->json([
        'status' => 'error',
        'message' => 'ID do projeto é obrigatório e deve ser válido',
        'errors' => $e->errors()
      ], 422);
    } catch (\Exception $e) {
      Log::error('Erro ao gerar stories: ' . $e->getMessage());
      return response()->json([
        'status' => 'error',
        'message' => 'Erro ao processar solicitação: ' . $e->getMessage()
      ], 500);
    }
  }

  private function parseResponse(string $content): array
  {
    try {
      // Remove os blocos de markdown ```json e ``` antes do parsing
      $cleanedContent = preg_replace('/```json\n([\s\S]*?)\n```/', '$1', $content);
      $cleanedContent = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $cleanedContent);
      $cleanedContent = trim($cleanedContent);
      
      $data = json_decode($cleanedContent, true, 512, JSON_THROW_ON_ERROR);

      // Extrai apenas o array de stories do JSON
      if (!isset($data['stories']) || !is_array($data['stories'])) {
        throw new \Exception("Resposta da IA não contém 'stories' válidos.");
      }

      return $data;
    } catch (\JsonException $e) {
      throw new \Exception('Erro ao fazer parsing do JSON: ' . $e->getMessage());
    } catch (\Exception $e) {
      throw new \Exception('Erro ao fazer o PARSER: ' . $e->getMessage());
    }
  }

  // MODIFICADO: Novo método createPrompt que usa dados do banco
  private function createPrompt(array $personas, array $journeys, array $productConstraints, array $constraintGoals): string
  {
    $personasText = $this->formatPersonasForPrompt($personas);
    $journeysText = $this->formatJourneysForPrompt($journeys);
    $constraintsText = $this->formatConstraintsForPrompt($productConstraints);
    $constraintGoalsText = $this->formatConstraintGoalsForPrompt($constraintGoals);

    return <<<PROMPT
        Com base nos dados fornecidos do sistema, gere user stories e system stories no formato especificado abaixo:

        CONTEXTO PARA USER STORIES:
        Personas (incluindo seus goals): $personasText
        
        User Journeys: $journeysText

        CONTEXTO PARA SYSTEM STORIES:
        Restrições do Produto: $constraintsText
        
        Constraint Goals (Goals Sketch tipo 'cg'): $constraintGoalsText

        INSTRUÇÕES:
        - Para USER STORIES: Use as personas (com seus goals internos) e journeys como contexto para criar histórias centradas no usuário
        - Para SYSTEM STORIES: Use as restrições do produto e constraint goals do goal_sketches (tipo 'cg'). Também acrescente atributos de qualidade para system stories na descrição.

        Formato requerido:
        Inicio do formato requerido           
        {
            "stories":
                [
                    {
                        "title":"texto da story",
                        "type":"user|system"
                    }
                ]
        }
        Fim do formato requerido

        Exemplo de User Story:
          "title": "Eu como Thiago Guimarães quero criar listas e adicionar a elas obras disponíveis na plataforma para criar playlists de filmes."
          "type": "user
        Fim do exemplo de User Story:

        Exemplo de System Story:
          "title": "Otimização de Streaming. Descrição: Implementar tecnologias de compressão eficientes e entrega de conteúdo via CDN (Content Delivery Network) para garantir uma transmissão de vídeo sem interrupções e com carregamento rápido. Atributo de Qualidade: Desempenho e Eficiência"
          "type": "system"
        Fim do exemplo de System Story

        Retorne apenas o JSON e não use \ para escapar caracteres especiais.
        
        IMPORTANTE: Caso não haja dados suficientes para um tipo de story, não gere ou invente stories.
        IMPORTANTE: Gere apenas stories baseadas nos dados fornecidos acima.
        PROMPT;
  }

  // Métodos auxiliares para buscar dados do banco de dados
  private function getPersonasFromDatabase(int $projectId): array
  {
    try {
      // Buscar personas com seus goals (do campo jsonb 'goals')
      return \DB::table('personas')
        ->select('goals')
        ->where('project_id', $projectId)
        ->get()
        ->toArray();
    } catch (\Exception $e) {
      Log::error('Erro ao buscar personas: ' . $e->getMessage());
      throw new \Exception('Erro ao buscar personas: ' . $e->getMessage());
    }
  }

  private function getJourneysFromDatabase(int $projectId): array
  {
    try {
      // Buscar journeys da tabela journeys
      return \DB::table('journeys')
        ->select('id', 'title', 'steps')
        ->where('project_id', $projectId)
        ->get()
        ->toArray();
    } catch (\Exception $e) {
      Log::error('Erro ao buscar journeys: ' . $e->getMessage());
      throw new \Exception('Erro ao buscar journeys: ' . $e->getMessage());
    }
  }

  private function getProductConstraintsFromDatabase(int $projectId): array
  {
    try {
      // Buscar restrições do product_canvas
      return \DB::table('product_canvas')
        ->select('id', 'restrictions')
        ->where('project_id', $projectId)
        ->whereNotNull('restrictions')
        ->where('restrictions', '!=', '')
        ->get()
        ->toArray();
    } catch (\Exception $e) {
      Log::error('Erro ao buscar restrições: ' . $e->getMessage());
      throw new \Exception('Erro ao buscar restrições: ' . $e->getMessage());
    }
  }

  private function getConstraintGoalsFromDatabase(int $projectId): array
  {
    try {
      // Buscar constraint goals (type = 'cg') da tabela goal_sketches
      return \DB::table('goal_sketches')
        ->select('id', 'title', 'type', 'priority')
        ->where('project_id', $projectId)
        ->where('type', 'cg')
        ->get()
        ->toArray();
    } catch (\Exception $e) {
      Log::error('Erro ao buscar constraint goals: ' . $e->getMessage());
      throw new \Exception('Erro ao buscar constraint goals: ' . $e->getMessage());
    }
  }

  // Métodos para formatar os dados para o prompt
  private function formatPersonasForPrompt(array $personas): string
  {
    if (empty($personas)) {
      return "Nenhuma persona definida";
    }
    
    $formatted = [];
    foreach ($personas as $persona) {
      $goals = is_string($persona->goals) ? json_decode($persona->goals, true) : $persona->goals;
      
      if ($goals) {
        $goalsText = is_array($goals) ? implode(', ', $goals) : $goals;
        $personaText = "\nGoals: " . $goalsText;
      }
      
      $formatted[] = $personaText;
    }
    return implode("\n\n", $formatted);
  }

  private function formatJourneysForPrompt(array $journeys): string
  {
    if (empty($journeys)) {
      return "Nenhuma journey definida";
    }
    
    $formatted = [];
    foreach ($journeys as $journey) {
      $steps = is_string($journey->steps) ? json_decode($journey->steps, true) : $journey->steps;
      
      $journeyText = "Journey: " . ($journey->title ?? 'N/A') . " (ID: {$journey->id})";
      
      if (is_array($steps)) {
        $stepsText = [];
        foreach ($steps as $step) {
          if (is_array($step) && isset($step['description'])) {
            $touchpoint = isset($step['is_touchpoint']) && $step['is_touchpoint'] ? ' [TOUCHPOINT]' : '';
            $stepsText[] = $step['description'] . $touchpoint;
          } elseif (is_string($step)) {
            $stepsText[] = $step;
          }
        }
        $journeyText .= "\nPassos: " . implode(' -> ', $stepsText);
      } else {
        $journeyText .= "\nPassos: " . ($steps ?? 'N/A');
      }
      
      $formatted[] = $journeyText;
    }
    return implode("\n\n", $formatted);
  }

  private function formatConstraintsForPrompt(array $constraints): string
  {
    if (empty($constraints)) {
      return "Nenhuma restrição definida";
    }
    
    $formatted = [];
    foreach ($constraints as $constraint) {
      if (!empty($constraint->restrictions)) {
        $formatted[] = "Restrições do Produto (ID: {$constraint->id}): " . $constraint->restrictions;
      }
    }
    
    return empty($formatted) ? "Nenhuma restrição definida" : implode("\n", $formatted);
  }

  private function formatConstraintGoalsForPrompt(array $constraintGoals): string
  {
    if (empty($constraintGoals)) {
      return "Nenhum constraint goal definido";
    }
    
    $formatted = [];
    foreach ($constraintGoals as $constraintGoal) {
      $priorityText = ucfirst($constraintGoal->priority ?? 'N/A');
      $formatted[] = "Constraint Goal (ID: {$constraintGoal->id}): " . ($constraintGoal->title ?? 'N/A') . 
                    " (Prioridade: " . $priorityText . ")" .
                    " - Foco em atributos de qualidade como performance, segurança, escalabilidade";
    }
    return implode("\n", $formatted);
  }

}