import os
import json
import requests # Adicionado para chamar a API do Laravel
from flask import Flask, request, Response, jsonify
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import tool # Importa o decorador de ferramenta

# Carrega variáveis de ambiente (ex: GOOGLE_API_KEY, PYTHON_SERVICE_API_KEY)
load_dotenv()

app = Flask(__name__)

# --- Configuração do Modelo e API Key ---
if not os.getenv("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY", "")

model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash") 
llm = ChatGoogleGenerativeAI(model=model_name, temperature=0.7)

# --- Configuração das Ferramentas (Tools) ---

# URL da API de Ferramentas do Laravel
LARAVEL_TOOL_API_URL = os.getenv("LARAVEL_TOOL_API_URL", "http://127.0.0.1:8000/api/tools/get-artifact-data")
# Chave secreta para autenticar no Laravel
LARAVEL_API_KEY = os.getenv("PYTHON_SERVICE_API_KEY", "")

@tool
def get_data_for_artifact(artifact_name: str, project_id: int) -> str:
    """
    Busca os dados (em JSON) de um artefato específico
    (como 'Personas', 'Goals', 'Journeys', 'Stories')
    de um projeto no backend principal do Laravel.
    Use esta ferramenta sempre que o usuário perguntar sobre
    dados específicos do projeto (ex: 'quantas personas temos?',
    'liste as jornadas').
    """
    print(f"--- Chamando Ferramenta: get_data_for_artifact(artifact='{artifact_name}', project_id={project_id}) ---")
    if not LARAVEL_API_KEY:
        return "Erro de configuração: PYTHON_SERVICE_API_KEY não definida no .env"
    
    try:
        response = requests.post(
            LARAVEL_TOOL_API_URL,
            headers={
                "X-Internal-API-Key": LARAVEL_API_KEY,
                "Accept": "application/json"
            },
            json={
                "artifact_name": artifact_name,
                "project_id": project_id
            }
        )
        response.raise_for_status() # Lança erro se a resposta for 4xx ou 5xx
        print("--- Resposta da Ferramenta (JSON): ---")
        print(response.json())
        return response.json() # Retorna os dados
    except requests.exceptions.HTTPError as e:
        print(f"Erro HTTP: {e.response.text}")
        return f"Erro ao buscar dados: {e.response.status_code} - {e.response.text}"
    except Exception as e:
        print(f"Erro inesperado na ferramenta: {str(e)}")
        return f"Erro ao chamar a ferramenta: {str(e)}"

# Lista de ferramentas que o agente pode usar
tools = [get_data_for_artifact]

# --- Configuração do Agente (Agent) ---

# 1. O Prompt do Agente
# O LangChain usará este template para formatar as entradas para o LLM
agent_prompt = ChatPromptTemplate.from_messages([
    ("system", "{system_prompt}"), # Nosso prompt de sistema (definido abaixo)
    MessagesPlaceholder(variable_name="chat_history"), # O histórico de chat
    ("human", "{input}"), # A mensagem atual do usuário
    MessagesPlaceholder(variable_name="agent_scratchpad"), # Onde o agente "pensa" (logs, etc.)
])

# 2. Criar o Agente
# Este agente é especializado em usar as Funções/Ferramentas do Gemini
agent = create_tool_calling_agent(llm, tools, agent_prompt)

# 3. Criar o Executor do Agente
# O Executor é quem realmente "roda" o agente (loop de pensamento, chamada de ferramenta, etc.)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True) # verbose=True é ótimo para debug no console

# --- Funções de Ajuda (Portadas do PHP) ---

def get_methodology_context():
    return """
    As cerimônias do REACT e REACT-M são etapas estruturadas para o desenvolvimento e gerenciamento de requisitos de software. 
    Ambos os métodos buscam entregar um produto de maior qualidade. O REACT foca no desenvolvimento de requisitos, 
    que inclui a elicitação, análise, especificação e validação, enquanto o REACT-M aborda o gerenciamento de requisitos, com foco em mudanças e rastreabilidade. 
    O REACT-M é uma extensão do REACT, compartilhando as mesmas cerimônias e papéis, mas adicionando atividades específicas de gerenciamento.

    A seguir, a descrição de cada cerimônia e seus artefatos:

    1. Inception
      Objetivo: 
        É a primeira cerimônia, realizada no início do projeto, com o objetivo principal de estabelecer uma visão de alto nível do produto pretendido, 
        definindo o que ele é e o que não é, o problema de negócio que busca resolver, suas restrições e seus usuários-chave ou fornecedores de requisitos. 
        Pode ser repetida dependendo das mudanças no projeto ou antes de cada entrega.
      Etapas/Atividades:
        Obter visão do produto: O Customer e o Domain Expert, auxiliados pelo Facilitator, explicam como imaginam o produto, 
        o problema a ser resolvido, a solução proposta, as personas e as restrições.
        Obter Goal Sketch: Mapear as metas de negócio (business goals) e as restrições de negócio (constraint goals) do produto, 
        classificando-as em alta, média ou baixa prioridade.
        Obter Personas: Modelar os usuários-chave (fornecedores de requisitos) identificados, detalhando seus comportamentos, 
        expectativas e objetivos em relação ao produto. Esta é a primeira atividade do REACT-M: Identificar Fornecedores de Requisitos.
        Obter Journeys: Mapear as etapas de interação do usuário com o sistema para alcançar um objetivo definido na modelagem da persona, 
        incluindo as ações do usuário e as respostas esperadas do sistema (touch points).
      Artefatos Gerados: Product Canvas, Goal Sketch, Personas, Journeys.

    2. Story Discovery
      Objetivo: 
        Elicitar estórias de usuário (requisitos funcionais) e estórias do sistema (requisitos não-funcionais) 
        a partir dos objetivos das personas e das jornadas de usuário, e das restrições e metas de negócio.
        Também visa conceber um Overall Model e iniciar a priorização dos requisitos.
      Etapas/Atividades:
        Descobrir Stories: Elicitar User Stories (requisitos funcionais, seguindo o padrão "Como [Persona], 
        eu quero [funcionalidade] para [objetivo]") e System Stories (requisitos não-funcionais, com título, descrição da restrição e atributo de qualidade). 
        Cada estória recebe um ID único para rastreabilidade.
        Inspeção: Avaliar e validar continuamente os requisitos usando os critérios INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable) 
        para verificar sua correção, testabilidade e alinhamento com as necessidades do cliente. Inconsistências são registradas em "inconsistency cards".
        Descobrir Overall Model: Projetar a arquitetura funcional e os objetos do produto, identificando classes 
        e seus possíveis colaboradores usando a técnica CRC (Class Responsibility Card).
        Descobrir Prioridades: Negociar e priorizar as estórias elicitadas com base no valor de negócio e na complexidade de implementação, 
        usando uma matriz ou gráfico de priorização.
      Atividades do REACT-M:
        Elaborar Backlog de Tarefas: O Domain Expert cria um Product Backlog com as estórias priorizadas e gerencia a ordem de entrega usando um Domain Expert Kanban. 
        O Team também gerencia suas tarefas técnicas com um Team Kanban.
        Avaliar e Dimensionar o Backlog com a Equipe Técnica: 
        O Team valida as User Stories selecionadas para o ciclo de desenvolvimento usando critérios INVEST e o conceito "Definition of Ready". 
        O esforço é estimado usando a técnica de Planning Poker, que atribui "User Story Points".
      Artefatos Gerados: Estórias de Usuário e do Sistema, Overall Model (com CRC Cards), Matriz de Priorização, Product Backlog (Kanban), 
        Team Kanban, Check Card e Inconsistency Card (da Inspection).

    3. Refining
      Objetivo: 
        Detalhamento e elaboração das estórias mais prioritárias, refinando-as com suas regras de negócio, 
        decompondo estórias grandes e definindo cenários de aceitação (comportamentos do produto na visão dos usuários finais).
      Etapas/Atividades:
        Decomposição de Stories Épicas: Quebrar estórias muito grandes ("épicas") em estórias menores e mais delimitadas, 
        mantendo a rastreabilidade com a estória original através de códigos de identificação.
        Refinamento de Regras de Negócio: Analisar cada User Story para identificar regras de negócio relacionadas, 
        que são declarações que definem ou restringem partes do negócio e refletem políticas, procedimentos e práticas.
        Definição de Cenários de Aceitação: Criar cenários de aceitação para as estórias prioritárias, descrevendo as condições, 
        ações e resultados esperados para validar um requisito após sua implementação. Isso também auxilia na fase de testes.
      Artefatos Gerados: Estórias refinadas (com suas derivadas), Regras de Negócio, Cenários de Aceitação.

    4. Modeling
      Objetivo:
        Detalhar as Stories sob a perspectiva de objetos do produto e de seus componentes, refinando o Overall Model com mais detalhes. 
        Também envolve a representação do funcionamento operacional do produto e seus componentes usando UI Storyboards.
      Etapas/Atividades:
        Modelagem Funcional: Definir as responsabilidades (dados e ações) para cada classe do Overall Model, podendo incluir novas classes ou objetos.
        Modelagem de Interfaces: Identificar interfaces internas (pontos de comunicação entre módulos do sistema) e externas 
        (pontos de comunicação com entes externos como APIs), baseando-se no Overall Model e nas colaborações entre classes.
        Modelagem de Conceitos Operacionais: Criar protótipos visuais (UI Storyboards) que simulem o fluxo operacional do produto, 
        mapeando o encadeamento das User Stories e suas dependências. Servem como camada adicional de validação e auxílio à implementação.
      Artefatos Gerados: Overall Model refinado (CRC Cards com responsabilidades), Interfaces Internas e Externas, UI Storyboards/Protótipos.

    5. Inspection
      Objetivo:
        É uma cerimônia de execução contínua, realizada ao fim de cada cerimônia, com o objetivo de verificar e validar a viabilidade 
        e a qualidade dos requisitos elicitados e artefatos derivados.
      Etapas/Atividades:
        Verificação e Validação Contínua: Avaliar os requisitos com o auxílio dos critérios INVEST (Independent, Negotiable, Valuable, Estimable, Sized-Appropriately, Testable).
        Atividades do REACT-M:
        Revisar e Registrar Inconsistências: Utilizar check cards para auxiliar a inspeção e inconsistency cards para registrar falhas e propor soluções.
        Tratar Mudanças no Backlog: Gerenciar mudanças identificadas pelo Domain Expert, atualizando o Backlog, 
        repriorizando e registrando em um formulário de controle de mudanças.
      Artefatos Gerados: Check Card e Inconsistency Card, Formulário de Controle de Mudanças (REACT-M).

    Os métodos REACT e REACT-M são abordagens ágeis que estruturam o desenvolvimento e gerenciamento de requisitos de software, 
    buscando entregar um produto de maior qualidade. O REACT foca no desenvolvimento de requisitos (elicitação, análise, especificação e validação), 
    enquanto o REACT-M é uma extensão que aborda o gerenciamento de requisitos, com foco em mudanças e rastreabilidade. 
    Ambos os métodos compartilham as mesmas cerimônias e papéis, com o REACT-M adicionando atividades específicas de gerenciamento.

    As cerimônias do REACT e REACT-M são: Inception, Story Discovery, Refining, Modeling e Inspection. 
    A seguir, descrevo o Backlog do Projeto e as Sprints dentro do contexto dessas cerimônias.

      ### Backlog do Produto (Product Backlog)
      O Backlog do Produto é uma lista de tarefas. No contexto do REACT e REACT-M, ele é formado pelas estórias de usuário e do sistema que foram levantadas e priorizadas. 
      O Domain Expert é o responsável por manter esse Backlog atualizado e gerenciado. A priorização é feita com base no valor de negócio e na complexidade de implementação de cada estória. 
      Para auxiliar o gerenciamento, o REACT-M sugere a utilização de um Kanban adaptado para o Domain Expert. 
      As estórias selecionadas para o ciclo de desenvolvimento devem ser validadas pelo Team usando os critérios INVEST e o conceito de "Definition of Ready".

      ### Sprints
      No contexto do REACT e REACT-M, as sprints referem-se aos ciclos curtos e iterativos de desenvolvimento. 
      As cerimônias de Story Discovery, Refining, Modeling e Inspection são recomendadas para acontecerem de forma iterativa dentro de curtas iterações. 
      As estórias de maior prioridade são movidas do "Product Backlog" para a seção "Sprint Backlog" do Domain Expert Kanban. 
      Para o Team gerenciar suas tarefas técnicas, é utilizado o Team Kanban. 
      O Team é responsável por estimar o esforço necessário para a implementação dos itens do Backlog, utilizando User Story Points com a técnica de Planning Poker.

      ### Tratamento de Mudanças no Backlog e Sprints
      Quando mudanças no produto são identificadas, o Backlog deve ser atualizado e repriorizado. 
      O Backlog precisa ser novamente validado pelo Team. Todo o ciclo de cerimônias do REACT-M deve ser executado novamente para contemplar a mudança. 
      Para controlar as solicitações de mudança, o Domain Expert pode utilizar um formulário de controle de mudanças.
    """

def build_system_prompt(data) -> str:
    """
    Constrói o prompt de sistema, agora sem o JSON de 'context_data',
    mas COM o project_id para a ferramenta.
    """
    project = data.get('project', {})
    user = data.get('user', {})
    page_context = data.get('page_context', {})
    
    page_name = page_context.get('page', 'Página Desconhecida')
    artifact_name = page_context.get('artifact', 'Artefato Desconhecido')
    user_name = user.get('name', 'Usuário')
    user_role = "Não definido"
    try:
        user_role = user.get('pivot', {}).get('role', {}).get('value', 'Não definido')
    except Exception: pass
        
    project_id = project.get('id', 'desconhecido') # <--- IMPORTANTE
    project_title = project.get('title', 'Meu Projeto')
    project_desc = project.get('description', '')
    project_status = "Não definido"
    try:
        project_status = project.get('status', {}).get('value', 'Não definido')
    except Exception: pass

    methodology_context = get_methodology_context()

    # O prompt de sistema é quase o mesmo, mas a Instrução 4 mudou.
    system_prompt_content = f"""Você é um Assistente de IA atuando como **Facilitator** da metodologia ágil de requisitos REACT-M. Seu papel **NÃO** é apenas responder perguntas, mas **agir como um coach e guia** para o usuário, conforme descrito na metodologia.

    **Seu Objetivo (O Papel do Facilitator):** Guiar todos os envolvidos a aplicar o REACT-M da melhor forma possível. Você deve ser proativo, colaborativo e ajudar a equipe a executar as cerimônias.

    **Instruções de Tom e Ação:**
    1. **Seja um Guia, Não um Dicionário:** ... (ex: 'Vejo que estamos em Inception, na tela de Personas...').
    2. **Use o Contexto da Página:** Sempre relacione sua resposta à página ('{page_name}') e ao artefato ('{artifact_name}') que o usuário está vendo.
    3. **Seja Proativo:** Faça perguntas que guiem o usuário...
    4. **Use os Dados Atuais:** Se o usuário perguntar sobre os dados, use o JSON fornecido (abaixo) para responder...
    5. **Mantenha-se na Metodologia:** Sua única fonte de verdade sobre o processo é a base de conhecimento abaixo. Não invente cerimônias ou passos.

    **Instruções de Formatação:** ... Exemplo: '* Item 1\\n  * Sub-item 1.1'.**

    ==== INÍCIO DA BASE DE CONHECIMENTO DA METODOLOGIA ====
    {methodology_context}
    ==== FIM DA BASE DE CONHECIMENTO DA METODOLOGIA ====

    Contexto do Usuário:
    - Nome: {user_name}
    - Papel no Projeto: {user_role}

    Contexto do Projeto '{project_title}':
    - Status Atual: {project_status}
    - Descrição: {project_desc}

    Contexto da Página Atual: '{page_name}'
    Contexto do Artefato Atual: '{artifact_name}'
    """
    return system_prompt_content

def build_chat_history(chat_history_raw):
    """
    Converte o histórico de chat do Laravel para o formato do LangChain.
    """
    messages = []
    # O `history` do React/Laravel agora inclui a mensagem atual como a última.
    # O Agente (input) espera a última mensagem separada,
    # então pegamos todas, exceto a última.
    for msg in chat_history_raw[:-1]: # [:-1] Pega todos, exceto o último
        if msg.get('message'):
            sender = msg.get('sender')
            content = msg.get('message')
            
            if sender == 'user':
                messages.append(HumanMessage(content=content))
            elif sender == 'bot' or sender == 'model':
                messages.append(AIMessage(content=content))
    return messages

# --- Endpoint de Chat (Modificado para usar o Agente) ---

@app.route('/chat-stream', methods=['POST'])
def chat_stream():
    if not request.json:
        return jsonify({"error": "Requisição inválida"}), 400
    
    try:
        request_data = request.json
        
        # 1. Construir o prompt de sistema
        system_prompt = build_system_prompt(request_data)
        
        # 2. Construir o histórico de chat
        # O histórico completo (incluindo a última mensagem) é enviado pelo Laravel
        chat_history_raw = request_data.get('history', [])
        
        # Separa o histórico passado da mensagem atual
        chat_history_messages = build_chat_history(chat_history_raw)
        
        # Pega a última mensagem (o input do usuário)
        user_input = ""
        if chat_history_raw:
            user_input = chat_history_raw[-1].get('message', '')

        if not user_input:
            return jsonify({"error": "Mensagem do usuário vazia"}), 400

        # 3. Montar o input para o agente
        input_data = {
            "system_prompt": system_prompt,
            "chat_history": chat_history_messages,
            "input": user_input,
        }

        # 4. Invocar o agente (AGORA BLOQUEANTE)
        # O agente vai rodar, "pensar", e talvez chamar a ferramenta (API do Laravel)
        print("--- Invocando Agente ---")
        response = agent_executor.invoke(input_data)
        print("--- Agente Concluído ---")
        
        # A resposta final está em 'output'
        final_answer = response.get("output", "Desculpe, não consegui processar sua solicitação.")

        # 5. Fazer o stream da resposta final
        # O frontend (ChatBot.jsx) tem um efeito de "digitação" (setInterval).
        # Se enviarmos o texto todo, ele vai "digitar" rápido, o que é perfeito.
        def stream_text(text):
            yield text

        return Response(stream_text(final_answer), mimetype='text/plain')

    except Exception as e:
        print(f"Erro no endpoint /chat-stream: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)