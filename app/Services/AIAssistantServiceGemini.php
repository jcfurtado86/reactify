<?php

namespace App\Services;

use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Gemini\Laravel\Facades\Gemini;

class AIAssistantServiceGemini
{
  protected $pythonServiceUrl;

  public function __construct()
  {
    $this->pythonServiceUrl = config('services.python_chat_service.url');
    
    if (!$this->pythonServiceUrl) {
      Log::error('PYTHON_CHAT_SERVICE_URL não definida no .env ou config/services.php');
      $this->pythonServiceUrl = 'http://127.0.0.1:5002/chat-stream';
    }
  }

  /**
     * Envia os dados para o serviço Python e espera pela resposta COMPLETA.
     * Este método é BLOQUEANTE e deve ser usado apenas em JOBS (filas).
     *
     * @return string A resposta completa da IA.
     */
    public function generateBlockingResponse(Project $project, User $user, array $pageContext, array $chatHistory, string $userMessage): string
    {
        $userRole = $project->users()->find($user->id)->pivot->role;
        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'pivot' => ['role' => ['value' => $userRole->value ?? null]]
        ];
        
        $projectData = [
            'id' => $project->id,
            'title' => $project->title,
            'status' => $project->status,
            'description' => $project->description,
        ];

        try {
            // stream' => false (ou omitido) e 'timeout' longo
            $response = Http::withOptions([
                'timeout' => 600, 
            ])
            ->post($this->pythonServiceUrl, [
                'project' => $projectData,
                'user' => $userData,
                'page_context' => $pageContext,
                'history' => $chatHistory,
                'message' => $userMessage, 
            ]);

            if (!$response->successful()) {
                Log::error('Falha ao conectar com o serviço Python de IA (bloqueante)', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return "Erro: Não foi possível conectar ao serviço de IA. (Status: {$response->status()})";
            }

            // Retorna o corpo da resposta completo como uma string
            return $response->body();

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Erro de conexão ao serviço Python de IA (bloqueante): ' . $e->getMessage());
            return "Erro crítico: O serviço de IA está offline. " . $e->getMessage();
        } catch (\Exception $e) {
            Log::error('Erro desconhecido no serviço de IA (bloqueante): ' . $e->getMessage());
            return "Erro: " . $e->getMessage();
        }
    }


//   /**
//    * Envia os dados para o serviço Python e faz o stream da resposta de volta
//    * para o ChatController, que a envia para o browser.
//    *
//    * @param Project $project
//    * @param User $user
//    * @param array $pageContext
//    * @param array $chatHistory
//    * @param string $userMessage
//    * @return void
//    */
//   public function generateStreamedResponse(Project $project, User $user, array $pageContext, array $chatHistory, string $userMessage, ?array $contextData): void
//   {
//     $userRole = $project->users()->find($user->id)->pivot->role;
//     $userData = [
//         'id' => $user->id,
//         'name' => $user->name,
//         'pivot' => [
//             'role' => [
//                 'value' => $userRole->value ?? null
//             ]
//         ]
//     ];
    
//     $projectData = [
//         'id' => $project->id,
//         'title' => $project->title,
//         'status' => $project->status,
//         'description' => $project->description,
//     ];

//     try {
//         Log::info('Iniciando conexão stream com o serviço Python de IA.', [
//             'url' => $this->pythonServiceUrl,
//             'project_id' => $project->id,
//             'user_id' => $user->id
//         ]);
//         $response = Http::withOptions([
//             'stream' => true,
//             'timeout' => 100,
//         ])
//         ->post($this->pythonServiceUrl, [
//             'project' => $projectData,
//             'user' => $userData,
//             'page_context' => $pageContext,
//             'history' => $chatHistory,
//             'message' => $userMessage, 
//             //'context_data' => $contextData,
//         ]);

//         if (!$response->successful()) {
//             Log::error('Falha ao conectar com o serviço Python de IA', [
//                 'status' => $response->status(),
//                 'body' => $response->body()
//             ]);
//             echo "Erro: Não foi possível conectar ao serviço de IA. (Status: {$response->status()})";
//             return;
//         }

//         // Se a conexão foi bem-sucedida, pegamos o corpo (stream)
//         $streamBody = $response->getBody();

//         // Seu ChatController.php não espera um 'return', ele espera um 'echo'
//         // (pois o método retorna 'void').
//         // Vamos ler o stream do Python e "ecoa-lo" pedaço por pedaço.
//         while (!$streamBody->eof()) {
//             $chunk = $streamBody->read(1024); // Lê 1KB de cada vez
        
//             // Log para debugar o que está vindo do Python
//             Log::debug('Chunk recebido do Python: ', ['chunk' => $chunk]); 

//             echo $chunk; 
//             flush();
//         }
        
//         Log::info('Stream com Python finalizado com sucesso.');

//     } catch (\Illuminate\Http\Client\ConnectionException $e) {
//         Log::error('Erro de conexão ao serviço Python de IA: ' . $e->getMessage());
//         echo "Erro crítico: O serviço de IA está offline. " . $e->getMessage();
//     } catch (\Exception $e) {
//         Log::error('Erro desconhecido no stream do chat: ' . $e->getMessage());
//         echo "Erro: " . $e->getMessage();
//     }
//   }


  // /**
  //  * Constrói o prompt para a IA com base no contexto fornecido.
  //  *
  //  * @param Project $project
  //  * @param User $user
  //  * @param string $pageContext
  //  * @param array $chatHistory
  //  * @param string $userMessage
  //  * @return array
  //  */
  // public function buildPrompt(Project $project, User $user, array $pageContext, array $chatHistory, string $userMessage, ?array $contextData): array
  // {
  //   try {
  //     $methodologyContext = $this->getMethodologyContext();
  //     $context = "Você é um Assistente de IA atuando como **Facilitator** da metodologia ágil de requisitos REACT-M. Seu papel **NÃO** é apenas responder perguntas, mas **agir como um coach e guia** para o usuário, conforme descrito na metodologia.\n\n";
  //     $context .= "**Seu Objetivo (O Papel do Facilitator):** Guiar todos os envolvidos a aplicar o REACT-M da melhor forma possível. Você deve ser proativo, colaborativo e ajudar a equipe a executar as cerimônias.\n\n";
  //     $context .= "**Instruções de Tom e Ação:**\n";
  //     $context .= "1. **Seja um Guia, Não um Dicionário:** Ao invés de apenas definir um artefato (ex: 'Persona'), explique **como** o usuário deve usá-lo no contexto do projeto e da página atual (ex: 'Vejo que estamos em Inception, na tela de Personas. Lembre-se, o objetivo aqui é modelar os usuários-chave para identificar os fornecedores de requisitos.').\n";
  //     $context .= "2. **Use o Contexto da Página:** Sempre relacione sua resposta à página ('{$pageContext['page']}') e ao artefato ('{$pageContext['artifact']}') que o usuário está vendo.\n";
  //     $context .= "3. **Seja Proativo:** Faça perguntas que guiem o usuário para a próxima etapa da metodologia (ex: 'Você gostaria de ajuda para criar uma nova Persona? ou 'Já definimos as Personas, que tal mapearmos as Jornadas (Journeys) delas?').\n";
  //     $context .= "4. **Use os Dados Atuais:** Se o usuário perguntar sobre os dados, use o JSON fornecido (abaixo) para responder. (ex: 'Atualmente, temos 3 Personas. Você quer revisá-las ou adicionar uma nova?').\n";
  //     $context .= "5. **Mantenha-se na Metodologia:** Sua única fonte de verdade sobre o processo é a base de conhecimento abaixo. Não invente cerimônias ou passos.\n\n";

  //     $context .= "**Instruções de Formatação: Ao criar listas, use a sintaxe padrão do Markdown. Para sub-listas, indente a linha com dois espaços e use um único asterisco. Exemplo: '* Item 1\\n  * Sub-item 1.1'.**\n\n";
  //     $context .= "==== INÍCIO DA BASE DE CONHECIMENTO DA METODOLOGIA ====\n\n";
  //     $context .= $methodologyContext;
  //     $context .= "\n\n==== FIM DA BASE DE CONHECIMENTO DA METODOLOGIA ====\n\n";

  //     $userRole = $project->users()->find($user->id)->pivot->role;
  //     $context .= "Contexto do Usuário:\n- Nome: {$user->name}\n";
  //     $context .= "- Papel no Projeto: {$userRole->value}\n\n";
      
  //     $context .= "Contexto do Projeto '{$project->title}':\n- Status Atual: {$project->status->value}\n- Descrição: {$project->description}\n\n";
  //     $context .= "Contexto da Página Atual: '{$pageContext['page']}'\n";
  //     $context .= "Contexto do Artefato Atual: '{$pageContext['artifact']}'\n";

  //     if (!empty($contextData)) {
  //       $jsonData = json_encode($contextData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
  //       $context .= "\nO usuário está visualizando os seguintes dados deste artefato na tela:\n";
  //       $context .= "```json\n" . $jsonData . "\n```\n";
  //     }
  //     $fullPrompt = $context . "\nHistórico da conversa: ";

  //     // Adiciona histórico do chat
  //     foreach ($chatHistory as $message) {
  //       if (!empty($message['message'])) {
  //         $sender = $message['sender'] === 'user' ? 'Usuário' : 'Assistente';
  //         $fullPrompt .= "{$sender}: " . $message['message'] . "\n";
  //       }
  //     }

  //     return [$fullPrompt];
  //   } catch (\Exception $e) {
  //     Log::error('Erro ao construir o prompt para o Gemini: ' . $e->getMessage());
  //     return [];
  //   }
  // }


  // private function getMethodologyContext(): string
  // {
  //   // Usamos a sintaxe HEREDOC do PHP para facilitar a escrita de um longo texto.
  //   return <<<EOD
  //   As cerimônias do REACT e REACT-M são etapas estruturadas para o desenvolvimento e gerenciamento de requisitos de software. 
  //   Ambos os métodos buscam entregar um produto de maior qualidade. O REACT foca no desenvolvimento de requisitos, 
  //   que inclui a elicitação, análise, especificação e validação, enquanto o REACT-M aborda o gerenciamento de requisitos, com foco em mudanças e rastreabilidade. 
  //   O REACT-M é uma extensão do REACT, compartilhando as mesmas cerimônias e papéis, mas adicionando atividades específicas de gerenciamento.

  //   A seguir, a descrição de cada cerimônia e seus artefatos:

  //   1. Inception
  //     Objetivo: 
  //       É a primeira cerimônia, realizada no início do projeto, com o objetivo principal de estabelecer uma visão de alto nível do produto pretendido, 
  //       definindo o que ele é e o que não é, o problema de negócio que busca resolver, suas restrições e seus usuários-chave ou fornecedores de requisitos. 
  //       Pode ser repetida dependendo das mudanças no projeto ou antes de cada entrega.
  //     Etapas/Atividades:
  //       Obter visão do produto: O Customer e o Domain Expert, auxiliados pelo Facilitator, explicam como imaginam o produto, 
  //       o problema a ser resolvido, a solução proposta, as personas e as restrições.
  //       Obter Goal Sketch: Mapear as metas de negócio (business goals) e as restrições de negócio (constraint goals) do produto, 
  //       classificando-as em alta, média ou baixa prioridade.
  //       Obter Personas: Modelar os usuários-chave (fornecedores de requisitos) identificados, detalhando seus comportamentos, 
  //       expectativas e objetivos em relação ao produto. Esta é a primeira atividade do REACT-M: Identificar Fornecedores de Requisitos.
  //       Obter Journeys: Mapear as etapas de interação do usuário com o sistema para alcançar um objetivo definido na modelagem da persona, 
  //       incluindo as ações do usuário e as respostas esperadas do sistema (touch points).
  //     Artefatos Gerados: Product Canvas, Goal Sketch, Personas, Journeys.

  //   2. Story Discovery
  //     Objetivo: 
  //       Elicitar estórias de usuário (requisitos funcionais) e estórias do sistema (requisitos não-funcionais) 
  //       a partir dos objetivos das personas e das jornadas de usuário, e das restrições e metas de negócio.
  //       Também visa conceber um Overall Model e iniciar a priorização dos requisitos.
  //     Etapas/Atividades:
  //       Descobrir Stories: Elicitar User Stories (requisitos funcionais, seguindo o padrão "Como [Persona], 
  //       eu quero [funcionalidade] para [objetivo]") e System Stories (requisitos não-funcionais, com título, descrição da restrição e atributo de qualidade). 
  //       Cada estória recebe um ID único para rastreabilidade.
  //       Inspeção: Avaliar e validar continuamente os requisitos usando os critérios INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable) 
  //       para verificar sua correção, testabilidade e alinhamento com as necessidades do cliente. Inconsistências são registradas em "inconsistency cards".
  //       Descobrir Overall Model: Projetar a arquitetura funcional e os objetos do produto, identificando classes 
  //       e seus possíveis colaboradores usando a técnica CRC (Class Responsibility Card).
  //       Descobrir Prioridades: Negociar e priorizar as estórias elicitadas com base no valor de negócio e na complexidade de implementação, 
  //       usando uma matriz ou gráfico de priorização.
  //     Atividades do REACT-M:
  //       Elaborar Backlog de Tarefas: O Domain Expert cria um Product Backlog com as estórias priorizadas e gerencia a ordem de entrega usando um Domain Expert Kanban. 
  //       O Team também gerencia suas tarefas técnicas com um Team Kanban.
  //       Avaliar e Dimensionar o Backlog com a Equipe Técnica: 
  //       O Team valida as User Stories selecionadas para o ciclo de desenvolvimento usando critérios INVEST e o conceito "Definition of Ready". 
  //       O esforço é estimado usando a técnica de Planning Poker, que atribui "User Story Points".
  //     Artefatos Gerados: Estórias de Usuário e do Sistema, Overall Model (com CRC Cards), Matriz de Priorização, Product Backlog (Kanban), 
  //       Team Kanban, Check Card e Inconsistency Card (da Inspection).

  //   3. Refining
  //     Objetivo: 
  //       Detalhamento e elaboração das estórias mais prioritárias, refinando-as com suas regras de negócio, 
  //       decompondo estórias grandes e definindo cenários de aceitação (comportamentos do produto na visão dos usuários finais).
  //     Etapas/Atividades:
  //       Decomposição de Stories Épicas: Quebrar estórias muito grandes ("épicas") em estórias menores e mais delimitadas, 
  //       mantendo a rastreabilidade com a estória original através de códigos de identificação.
  //       Refinamento de Regras de Negócio: Analisar cada User Story para identificar regras de negócio relacionadas, 
  //       que são declarações que definem ou restringem partes do negócio e refletem políticas, procedimentos e práticas.
  //       Definição de Cenários de Aceitação: Criar cenários de aceitação para as estórias prioritárias, descrevendo as condições, 
  //       ações e resultados esperados para validar um requisito após sua implementação. Isso também auxilia na fase de testes.
  //     Artefatos Gerados: Estórias refinadas (com suas derivadas), Regras de Negócio, Cenários de Aceitação.

  //   4. Modeling
  //     Objetivo:
  //       Detalhar as Stories sob a perspectiva de objetos do produto e de seus componentes, refinando o Overall Model com mais detalhes. 
  //       Também envolve a representação do funcionamento operacional do produto e seus componentes usando UI Storyboards.
  //     Etapas/Atividades:
  //       Modelagem Funcional: Definir as responsabilidades (dados e ações) para cada classe do Overall Model, podendo incluir novas classes ou objetos.
  //       Modelagem de Interfaces: Identificar interfaces internas (pontos de comunicação entre módulos do sistema) e externas 
  //       (pontos de comunicação com entes externos como APIs), baseando-se no Overall Model e nas colaborações entre classes.
  //       Modelagem de Conceitos Operacionais: Criar protótipos visuais (UI Storyboards) que simulem o fluxo operacional do produto, 
  //       mapeando o encadeamento das User Stories e suas dependências. Servem como camada adicional de validação e auxílio à implementação.
  //     Artefatos Gerados: Overall Model refinado (CRC Cards com responsabilidades), Interfaces Internas e Externas, UI Storyboards/Protótipos.

  //   5. Inspection
  //     Objetivo:
  //       É uma cerimônia de execução contínua, realizada ao fim de cada cerimônia, com o objetivo de verificar e validar a viabilidade 
  //       e a qualidade dos requisitos elicitados e artefatos derivados.
  //     Etapas/Atividades:
  //       Verificação e Validação Contínua: Avaliar os requisitos com o auxílio dos critérios INVEST (Independent, Negotiable, Valuable, Estimable, Sized-Appropriately, Testable).
  //       Atividades do REACT-M:
  //       Revisar e Registrar Inconsistências: Utilizar check cards para auxiliar a inspeção e inconsistency cards para registrar falhas e propor soluções.
  //       Tratar Mudanças no Backlog: Gerenciar mudanças identificadas pelo Domain Expert, atualizando o Backlog, 
  //       repriorizando e registrando em um formulário de controle de mudanças.
  //     Artefatos Gerados: Check Card e Inconsistency Card, Formulário de Controle de Mudanças (REACT-M).

  //   Os métodos REACT e REACT-M são abordagens ágeis que estruturam o desenvolvimento e gerenciamento de requisitos de software, 
  //   buscando entregar um produto de maior qualidade. O REACT foca no desenvolvimento de requisitos (elicitação, análise, especificação e validação), 
  //   enquanto o REACT-M é uma extensão que aborda o gerenciamento de requisitos, com foco em mudanças e rastreabilidade. 
  //   Ambos os métodos compartilham as mesmas cerimônias e papéis, com o REACT-M adicionando atividades específicas de gerenciamento.

  //   As cerimônias do REACT e REACT-M são: Inception, Story Discovery, Refining, Modeling e Inspection. 
  //   A seguir, descrevo o Backlog do Projeto e as Sprints dentro do contexto dessas cerimônias.

  //     ### Backlog do Produto (Product Backlog)
  //     O Backlog do Produto é uma lista de tarefas. No contexto do REACT e REACT-M, ele é formado pelas estórias de usuário e do sistema que foram levantadas e priorizadas. 
  //     O Domain Expert é o responsável por manter esse Backlog atualizado e gerenciado. A priorização é feita com base no valor de negócio e na complexidade de implementação de cada estória. 
  //     Para auxiliar o gerenciamento, o REACT-M sugere a utilização de um Kanban adaptado para o Domain Expert. 
  //     As estórias selecionadas para o ciclo de desenvolvimento devem ser validadas pelo Team usando os critérios INVEST e o conceito de "Definition of Ready".

  //     ### Sprints
  //     No contexto do REACT e REACT-M, as sprints referem-se aos ciclos curtos e iterativos de desenvolvimento. 
  //     As cerimônias de Story Discovery, Refining, Modeling e Inspection são recomendadas para acontecerem de forma iterativa dentro de curtas iterações. 
  //     As estórias de maior prioridade são movidas do "Product Backlog" para a seção "Sprint Backlog" do Domain Expert Kanban. 
  //     Para o Team gerenciar suas tarefas técnicas, é utilizado o Team Kanban. 
  //     O Team é responsável por estimar o esforço necessário para a implementação dos itens do Backlog, utilizando User Story Points com a técnica de Planning Poker.

  //     ### Tratamento de Mudanças no Backlog e Sprints
  //     Quando mudanças no produto são identificadas, o Backlog deve ser atualizado e repriorizado. 
  //     O Backlog precisa ser novamente validado pelo Team. Todo o ciclo de cerimônias do REACT-M deve ser executado novamente para contemplar a mudança. 
  //     Para controlar as solicitações de mudança, o Domain Expert pode utilizar um formulário de controle de mudanças.
  //   EOD;
  // }
}
