import os
import json
import requests 
from flask import Flask, request, Response, jsonify
from dotenv import load_dotenv
import langchain
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain.agents import create_agent
from langchain.tools import tool 
from langchain_core.tracers.langchain import wait_for_all_tracers
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_postgres import PGVector
from langchain_classic.tools.retriever  import create_retriever_tool

# Carrega variáveis de ambiente (ex: GOOGLE_API_KEY, PYTHON_SERVICE_API_KEY)
load_dotenv()

app = Flask(__name__)

# --- Configuração do Modelo e API Key ---
if not os.getenv("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY", "")

model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash") 
llm = ChatGoogleGenerativeAI(model=model_name, temperature=0.7)
langchain.debug = True

print("🔄 Inicializando sistema RAG e Embeddings...")

# Caminho para o modelo local (mesmo do hf.py)
HF_MODEL_PATH = ".hf_models" 
# Se estiver rodando na mesma pasta, pode ser apenas "./.hf_models" ou o caminho absoluto
if not os.path.exists(HF_MODEL_PATH):
    # Fallback caso a pasta não seja encontrada imediatamente, ajusta para o diretório atual se necessário
    print("🔄 Pasta do modelo de embedding nao encontrado...")
    HF_MODEL_PATH = "./.hf_models" 

print("🔄 Inicializando Embeddings...")
embeddings = HuggingFaceEmbeddings(
    model_name=HF_MODEL_PATH, 
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)

# Conexão com o Banco Vetorial
connection_string = os.getenv("DATABASE_URL") # Certifique-se que isso está no .env
collection_name = "react"

print("🔄 Criando Vector Store...")
vector_store = PGVector(
    embeddings=embeddings,
    collection_name=collection_name,
    connection=connection_string,
    use_jsonb=True,
)

retriever = vector_store.as_retriever(search_kwargs={"k": 4})

# Cria a Ferramenta de RAG
# rag_tool = create_retriever_tool(
#     retriever,
#     "search_knowledge_base",
#     "Use esta ferramenta para buscar informações técnicas em documentos PDF, dissertações e manuais carregados no sistema. Útil para dúvidas sobre teoria, conceitos ou conteúdo específico dos arquivos."
# )
# --- Configuraçãco das Ferramentas (Tools) ---

# URL da API de Ferramentas do Laravel
LARAVEL_TOOL_API_URL = os.getenv("LARAVEL_TOOL_API_URL", "http://127.0.0.1:8001/api/tools/get-artifact-data")
# Chave secreta para autenticar no Laravel
LARAVEL_API_KEY = os.getenv("PYTHON_SERVICE_API_KEY", "")

@tool
def search_knowledge_base(query: str) -> str:
    """
    Use esta ferramenta para buscar informações técnicas em documentos PDF, 
    manuais e transcrições de vídeo. Útil para explicar conceitos teóricos do REACT-M.
    """
    print(f"\n🔎 --- Tool Call: search_knowledge_base(query='{query}') ---")
    
    # 1. Executa a busca no Postgres
    docs = retriever.invoke(query)
    results = vector_store.similarity_search_with_score(query, k=4)
    print("-" * 70)
    print(f"QUERY: {query}")

    for doc, score in results:
        print(f"   Score: {score:.4f} | Fonte: {doc.metadata.get('source')}")
        print(f"   Texto: {doc.page_content}...")
        print("-" * 70)
    
    if not docs:
        print("❌ Nenhum documento relevante encontrado.")
        return "Não encontrei informações relevantes na base de conhecimento."

    # 2. Loga (Printa) o que foi recuperado para você ver no terminal
    results_text = []
    print(f"✅ Recuperados {len(docs)} trechos de contexto:\n")
    
    for i, doc in enumerate(docs):
        source = doc.metadata.get("source", "Desconhecido")
        content_preview = doc.page_content.replace('\n', ' ') # Primeiros 200 chars
        
        print(f"   [Doc {i+1}] Fonte: {source}")
        print(f"   [Conteúdo]: {content_preview}...\n")
        
        # Monta o texto que será devolvido para o LLM ler
        results_text.append(f"--- Fonte: {source} ---\n{doc.page_content}\n")

    return "\n\n".join(results_text)

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
    print(f"🔎 --- Tool Call: get_data_for_artifact(artifact='{artifact_name}', project_id={project_id}) ---")
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
        wait_for_all_tracers()
        return response.json() # Retorna os dados
    except requests.exceptions.HTTPError as e:
        print(f"Erro HTTP: {e.response.text}")
        return f"Erro ao buscar dados: {e.response.status_code} - {e.response.text}"
    except Exception as e:
        print(f"Erro inesperado na ferramenta: {str(e)}")
        return f"Erro ao chamar a ferramenta: {str(e)}"

tools = [get_data_for_artifact, search_knowledge_base]

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
    artifact_name = page_context.get('artifact', 'Artefato Desconhecida')
    match artifact_name:
        case 'productCanvas':
            artifact_name = 'product_canvas'
        case 'goals':
            artifact_name = 'goal_sketches'
        case 'personas':
            artifact_name = 'personas'
        case 'journeys':
            artifact_name = 'journeys'
        case 'stories':
            artifact_name = 'stories'
        case 'overallModel':
            artifact_name = 'overall_model_classes'
        case 'prioritizationMatrix':
            artifact_name = 'prioritizations'
        case 'changeLog':
            artifact_name = 'change_requests'
        case 'epicStories':
            artifact_name = 'epic_stories'
        case 'businessRules':
            artifact_name = 'business_rules'
        case 'usageScenarios':
            artifact_name = 'usage_scenarios'
        case 'interfaces':
            artifact_name = 'system_interfaces'
        case 'storyboards':
            artifact_name = 'storyboards'
        case _:
            artifact_name = 'Artefato'
    match page_name:
        case 'productBacklog':
            artifact_name = 'product_backlog'
        case 'sprint':
            artifact_name = 'sprint'

    user_name = user.get('name', 'Usuário')
    user_role = "Não definido"
    try:
        user_role = user.get('pivot', {}).get('role', {}).get('value', 'Não definido')
    except Exception: pass
        
    project_id = project.get('id', 'desconhecido') 
    project_title = project.get('title', 'Meu Projeto')
    project_desc = project.get('description', '')

    methodology_context = ""#get_methodology_context()

    # O prompt de sistema é quase o mesmo, mas a Instrução 4 mudou.
    system_prompt_content = f"""Você é um Assistente de IA atuando como **Facilitador** da metodologia ágil de requisitos REACT-M. Seu papel **NÃO** é apenas responder perguntas, mas **agir como um coach e guia** para o usuário, conforme descrito na metodologia.

    **Ferramentas Disponíveis:**
    1. Se precisar de dados do banco de dados do projeto relacionados aos artefatos e cerimônias, use `get_data_for_artifact`.
    2. Se precisar de embasamento teórico e metodológico, use `search_knowledge_base`.

    **Seu Objetivo (O Papel do Facilitador):** Guiar todos os envolvidos a aplicar o REACT-M da melhor forma possível. Você deve ser proativo, colaborativo e ajudar a equipe a executar as cerimônias.

    **Instruções de Ferramentas:**
    1. Use quantas tools achar necessário
    2. Sempre prefira chamadas paralelas quando possível
    3. Sempre analise os dados retornados das tools antes de concluir
    4. Forneça um resumo com insights principais na resposta final

    **Instruções de Tom e Ação:**
    1. **Seja um Guia, Não um Dicionário:** ... (ex: 'Vejo que estamos em Inception, na tela de Personas...').
    2. **Use o Contexto da Página:** Sempre relacione sua resposta à página ('{page_name}') e ao artefato ('{artifact_name}') que o usuário está vendo.
    3. **Seja Proativo:** Faça perguntas que guiem o usuário...
    4. **Use os Dados Atuais:** Se o usuário perguntar sobre os dados, use o JSON fornecido (abaixo) para responder...

    **Instruções de Formatação:** ... Exemplo: '* Item 1\\n  * Sub-item 1.1'.**

    Contexto do Usuário:
    - Nome: {user_name}
    - Papel no Projeto: {user_role}

    Contexto do Projeto '{project_title}':
    - Descrição: {project_desc}

    Contexto da Cerimônia Atual: '{page_name}'
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

@app.route('/chat-stream', methods=['POST'])
def chat_stream():
    if not request.json:
        return jsonify({"error": "Requisição inválida"}), 400
    
    try:
        request_data = request.json
        # app.logger.info("\n------------ DADOS RECEBIDOS --------------\n%s\n", 
        #                 json.dumps(request_data, indent=2))

        system_prompt = build_system_prompt(request_data)
        #app.logger.info("\n------------ SYSTEM PROMPT --------------\n%s\n", system_prompt)
        
        chat_history_raw = request_data.get('history', [])
        
        # Convertemos o histórico do frontend para o formato do LangChain
        langchain_messages = []
        for message in chat_history_raw:
            sender = message.get('sender')
            content = message.get('message')
            
            if not content:
                continue
            
            # O React envia 'user'
            if sender == 'user':
                langchain_messages.append(HumanMessage(content=content))
            # O React envia 'bot', 'model', 'ai'
            elif sender in ['bot', 'model', 'ai', 'assistant']:
                langchain_messages.append(AIMessage(content=content))
        
        if not langchain_messages or not isinstance(langchain_messages[-1], HumanMessage):
             app.logger.warning("Histórico vazio ou não termina com mensagem humana.")
             # Adiciona a mensagem de 'message' se o histórico estiver vazio por algum motivo
             user_input = request_data.get('message', '')
             if user_input:
                 langchain_messages.append(HumanMessage(content=user_input))
             else:
                 return jsonify({"error": "Mensagem do usuário vazia"}), 400

        #app.logger.info(f"\n------------ HISTÓRICO ENVIADO AO AGENTE ({len(langchain_messages)} mensagens) --------------\n")
        
        log_messages_formatadas = []
        for msg in langchain_messages:
            # Limita a 150 caracteres para não poluir o log
            conteudo_truncado = (msg.content[:150] + '...') if len(msg.content) > 150 else msg.content
            # Remove quebras de linha do log
            conteudo_limpo = conteudo_truncado.replace('\n', ' ')
            
            log_messages_formatadas.append(f"  [{msg.type.upper()}]: {conteudo_limpo}")

        # Junta todas as mensagens formatadas em uma única string
        readable_history = "\n".join(log_messages_formatadas)
        
        # Imprime o log formatado
        #app.logger.info(readable_history)
        #app.logger.info("\n---------------------------------------------------------------------------------------\n")


        agent = create_agent(
          model=llm,
          tools=tools,
          system_prompt=system_prompt
        )

        app.logger.info("--- Invocando Agente ---")

        response = agent.invoke(
            {"messages": langchain_messages}
        ) 
        
        app.logger.info("--- Agente Concluído ---")
        #app.logger.debug(f"Resposta completa do agente: {response}")

        final_answer = ""
        if response and "messages" in response and response["messages"]:
            # Pega a última mensagem (uma AIMessage)
            last_message = response["messages"][-1] 
            
            # O 'content' pode ser uma string simples ou uma lista de blocos
            if hasattr(last_message, 'content'):
                if isinstance(last_message.content, str):
                    # Caso mais simples (ex: gemini-flash)
                    final_answer = last_message.content
                
                # Se for uma lista de 'content_blocks' (ex: gemini-pro)
                elif isinstance(last_message.content, list) and len(last_message.content) > 0:
                    # Um bloco de conteúdo padrão tem 'type' e 'text'
                    if isinstance(last_message.content[0], dict) and 'text' in last_message.content[0]:
                        final_answer = last_message.content[0]['text']
                    else:
                        app.logger.warning(f"Conteúdo da IA é lista, mas formato é inesperado: {last_message.content}")
                        final_answer = str(last_message.content) # Fallback
                else:
                    # Fallback para o atributo .text, se 'content' for outra coisa
                    final_answer = getattr(last_message, 'text', '')
            
        if not final_answer:
          app.logger.error("Não foi possível extrair a resposta final da IA")
          final_answer = "Erro: Não consegui processar uma resposta."

        #app.logger.info("\n------------ RESPOSTA FINAL EXTRAÍDA --------------\n%s\n", final_answer)

        def stream_text_generator(text):
            yield text
            app.logger.info("Resposta completa enviada ao Laravel.")

        return Response(stream_text_generator(final_answer), mimetype='text/plain')

    except Exception as e:
        app.logger.error(f"Erro GERAL no endpoint /chat-stream: {e}", exc_info=True)
        # Tenta enviar o erro como texto plano para o frontend
        error_message = f"Erro crítico no servidor de IA: {str(e)}"
        
        # Gerador simples para enviar o erro
        def stream_error_generator(text):
            yield text
            
        return Response(stream_error_generator(error_message), mimetype='text/plain', status=500)
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)