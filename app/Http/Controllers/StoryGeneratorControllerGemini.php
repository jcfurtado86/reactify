<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Gemini\Laravel\Facades\Gemini;
use App\Models\Interview;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Http\Requests\StoreStoryRequest;
use App\Services\StoryService;


class StoryGeneratorControllerGemini extends Controller
{

  public function generateStories(Request $request): JsonResponse
  {
    try {
      // Validar se o project_id foi enviado PRIMEIRO
      $request->validate([
        'project_id' => 'required|integer|min:1'
      ]);
      $projectId = $request->input('project_id');

      $interviews = $this->getInterviewsFromDatabase($projectId);
      $personas = $this->getPersonasFromDatabase($projectId);
      $journeys = $this->getJourneysFromDatabase($projectId);
      $productConstraints = $this->getProductConstraintsFromDatabase($projectId);
      $constraintGoals = $this->getConstraintGoalsFromDatabase($projectId);

      $missingItems = [];
      if (empty($interviews)) { 
        $missingItems[] = 'Entrevista com transcrição'; 
      }
      if (!$this->hasContentfulPersonas($personas)) {
        $missingItems[] = 'Objetivo de Persona';
      }
      if (!$this->hasContentfulJourneys($journeys)) {
        $missingItems[] = 'Step de Journey';
      }
      if (empty($productConstraints)) { 
        $missingItems[] = 'Restrição do Produto';
      }
      if (!$this->hasContentfulConstraintGoals($constraintGoals)) {
        $missingItems[] = 'Constraint Goal (CG) com título';
      }

      if (!empty($missingItems)) {
        $message = 'Para gerar histórias, é necessário cadastrar ao menos um de cada item a seguir: ' . implode(', ', $missingItems) . '.';
        return response()->json([
          'status' => 'warning',
          'message' => $message,
          'itens_faltantes' => $missingItems
        ], 422); // 422 (Unprocessable Entity)
      }


      $prompt = $this->createPrompt($interviews, $personas, $journeys, $productConstraints, $constraintGoals);
      Log::info("PROMPT PARA STORY: \n\n{$prompt}:");
      $modelName = config('gemini.model');
      $fullPrompt = 'Você é um especialista em engenharia de software e análise de requisitos. ' . $prompt;
      $result = Gemini::generativeModel(model: $modelName)->generateContent($fullPrompt);
      $responseText = $result->text();
      $parsedResponse = $this->parseResponse($responseText);

      return response()->json([
        'status' => 'sucesso',
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

  private function hasContentfulPersonas(array $personas): bool
  {
    if (empty($personas)) {
      return false;
    }
    foreach ($personas as $persona) {
      if (isset($persona->goals)) {
        $goals = is_string($persona->goals) ? json_decode($persona->goals, true) : $persona->goals;
        if (is_array($goals) && !empty($goals)) {
          return true; 
        }
      }
    }
    return false;
  }

  private function hasContentfulJourneys(array $journeys): bool
  {
    if (empty($journeys)) {
      return false;
    }
    foreach ($journeys as $journey) {
      if (isset($journey->steps)) {
        $steps = is_string($journey->steps) ? json_decode($journey->steps, true) : $journey->steps;
        if (is_array($steps) && !empty($steps)) {
          return true; 
        }
      }
    }
    return false;
  }

  /**
   * Verifica se existe ao menos um constraint goal com título.
   */
  private function hasContentfulConstraintGoals(array $constraintGoals): bool
  {
    if (empty($constraintGoals)) {
      return false;
    }
    foreach ($constraintGoals as $goal) {
      // Verifica se o título existe e não é apenas uma string vazia
      if (isset($goal->title) && !empty(trim($goal->title))) {
        return true;
      }
    }
    return false;
  }

  private function parseResponse(string $content): array
  {
    try {
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

  private function createPrompt(array $interviews, array $personas, array $journeys, array $productConstraints, array $constraintGoals): string
  {
    $interviewsText = $this->formatInterviewsForPrompt($interviews);
    $personasText = $this->formatPersonasForPrompt($personas);
    $journeysText = $this->formatJourneysForPrompt($journeys);
    $constraintsText = $this->formatConstraintsForPrompt($productConstraints);
    $constraintGoalsText = $this->formatConstraintGoalsForPrompt($constraintGoals);

    return <<<PROMPT
    Com base nos dados fornecidos do sistema, gere user stories e system stories no formato especificado abaixo:

    CONTEXTO PRINCIPAL (Use como base de conhecimento):
    - Transcrições de Entrevistas: {$interviewsText}

    CONTEXTO PARA USER STORIES:
    - Goals das Personas do Produto: $personasText

    - Journeys do Produto: $journeysText

    CONTEXTO PARA SYSTEM STORIES:
    - Restrições do Produto: $constraintsText

    - Constraint Goals do Produto: $constraintGoalsText

    INSTRUÇÕES:
    1. Para USER STORIES: Use as Goals das Personas e Journeys como contexto para criar histórias centradas no usuário.

    2. Para SYSTEM STORIES: Use as Restrições do Produto e Constraint Goals como contexto para criar histórias do sistema. Também acrescente atributos de qualidade na descrição das system stories.

    FORMATO REQUERIDO:
    INÍCIO DO FORMATO REQUERIDO
      {
        "stories":
          [
            {
              "title":"texto da story",
              "type":"user|system"
            }
          ]
      }
    FIM DO FORMATO REQUERIDO

    EXEMPLO DE USER STORY:
      {
        "title":"Eu como Thiago Guimarães quero criar listas e adicionar a elas obras disponíveis na plataforma para criar playlists de filmes.",
        "type":"user"
      }
    FIM DO EXEMPLO DE USER STORY:

    EXEMPLO DE SYSTEM STORY:
      {
        "title": "Título: Otimização de Streaming. Descrição: Implementar tecnologias de compressão eficientes e entrega de conteúdo via CDN (Content Delivery Network) para garantir uma transmissão de vídeo sem interrupções e com carregamento rápido. Atributo de Qualidade: Desempenho e Eficiência"
        "type": "system"
      }
    FIM DO EXEMPLO DE SYSTEM STORY

    3. Após escrever as stories, deve verificar e validar esses requisitos.
    Essa validação é feita com o uso dos critérios INVEST descritos abaixo:

    Os critérios INVEST são um acrônimo utilizado para avaliar a viabilidade e a qualidade dos requisitos elicitados durante a cerimônia de *Inspection* do método REACT.

    Os seis critérios que compõem o INVEST são:

    *   **I (Independent / Independente):**
        *   Representa a independência do requisito.
        *   O requisito deve ser **independente de outros requisitos para ser implementado** ou possuir a menor dependência possível.
        *   Este critério avalia a capacidade de um requisito ser implementado ou modificado sem gerar grandes impactos em demais requisitos.

    *   **N (Negotiable / Negociável):**
        *   Representa a negociação do requisito.
        *   Diz respeito a se aquele requisito foi **negociado ou não com o principal interessado** nele.
        *   O requisito deve estar **priorizado pelo Customer**.

    *   **V (Valuable / Valioso):**
        *   Representa o valor daquele requisito para o cliente.
        *   Deve **atender um ou mais objetivos definidos nas Personas**.
        *   Busca avaliar se o requisito representa valor para o cliente.

    *   **E (Estimable / Estimável):**
        *   Representa a **possibilidade de estimar o esforço** daquele requisito.
        *   Deve ser **possível estimar o esforço para a implementação**.

    *   **S (Sized-Apropriately / Tamanho Adequado ou Small / Pequeno):**
        *   O requisito deve ter um **tamanho apropriado**.
        *   Deve ser **pequeno o suficiente para ser implementado em uma iteração**.

    *   **T (Testable / Testável):**
        *   Representa a **possibilidade de testá-lo**.
        *   Deve ser **possível gerar cenários de teste de aceitação**.
        *   Avalia a capacidade de determinado requisito ser testado na prática.

    
    Seu trabalho então é inspecionar cada story gerada e garantir que esta esteja 
    de acordo com os critérios INVEST. Retorne sua resposta final apenas depois de passar por esses 3 passos.

    IMPORTANTE: Retorne apenas o JSON e não use \ para escapar caracteres especiais.
    IMPORTANTE: Caso não haja dados suficientes para um tipo de story, não gere ou invente stories.
    IMPORTANTE: Gere stories baseadas totalmente nos exemplos e informações fornecidos acima.
    PROMPT;
  }

  // Métodos auxiliares para buscar dados do banco de dados (mantendo o filtro de soft-delete)
  private function getPersonasFromDatabase(int $projectId): array
  {
    try {
      return \DB::table('personas')
        ->select('goals')
        ->where('project_id', $projectId)
        ->whereNull('deleted_at')
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
      return \DB::table('journeys')
        ->select('id', 'title', 'steps')
        ->where('project_id', $projectId)
        ->whereNull('deleted_at')
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
      return \DB::table('product_canvas')
        ->select('id', 'restrictions')
        ->where('project_id', $projectId)
        ->whereNotNull('restrictions')
        ->where('restrictions', '!=', '')
        ->whereNull('deleted_at')
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
      return \DB::table('goal_sketches')
        ->select('id', 'title', 'type', 'priority')
        ->where('project_id', $projectId)
        ->where('type', 'cg')
        ->whereNull('deleted_at')
        ->get()
        ->toArray();
    } catch (\Exception $e) {
      Log::error('Erro ao buscar constraint goals: ' . $e->getMessage());
      throw new \Exception('Erro ao buscar constraint goals: ' . $e->getMessage());
    }
  }

  // Métodos para formatar os dados para o prompt (inalterados)
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
    return implode("\n\n", $formatted);
  }

  private function getInterviewsFromDatabase(int $projectId): array
  {
    try {
      return Interview::where('project_id', $projectId)
                ->whereNotNull('transcript')
                ->where('transcript', '!=', '')
                ->pluck('transcript')
                ->toArray();
    } catch (\Exception $e) {
      Log::error('Erro ao buscar entrevistas: ' . $e->getMessage());
      throw new \Exception('Erro ao buscar entrevistas: ' . $e->getMessage());
    }
  }

  private function formatInterviewsForPrompt(array $interviews): string
  {
      if (empty($interviews)) {
          return "Nenhuma transcrição de entrevista fornecida.";
      }
      // Simplesmente junta todas as transcrições
      return implode("\n\n---\n\n", $interviews);
  }
}