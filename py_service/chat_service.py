import os
import json
import requests 
from flask import Flask, request, Response, jsonify
from dotenv import load_dotenv
import langchain
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import OpenAIEmbeddings
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain.agents import create_agent
from langchain.tools import tool 
from langchain_core.tracers.langchain import wait_for_all_tracers
from langchain_postgres import PGVector

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

# # Caminho para o modelo local (mesmo do hf.py)
# HF_MODEL_PATH = ".hf_models" 
# # Se estiver rodando na mesma pasta, pode ser apenas "./.hf_models" ou o caminho absoluto
# if not os.path.exists(HF_MODEL_PATH):
#     # Fallback caso a pasta não seja encontrada imediatamente, ajusta para o diretório atual se necessário
#     print("🔄 Pasta do modelo de embedding nao encontrado...")
#     HF_MODEL_PATH = "./.hf_models" 

# print("🔄 Inicializando Embeddings...")
# embeddings = HuggingFaceEmbeddings(
#     model_name=HF_MODEL_PATH, 
#     #model_name="BAAI/bge-m3",
#     model_kwargs={'device': 'cpu'},
#     encode_kwargs={'normalize_embeddings': True}
# )
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

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
def get_data_from_artifact(artifact_name: str, project_id: int) -> str:
    """
    Busca os dados (em JSON) de um artefato específico
    (como 'Personas', 'Goals', 'Journeys', 'Stories')
    de um projeto no backend principal do Laravel.
    Use esta ferramenta sempre que o usuário perguntar sobre
    dados específicos do projeto (ex: 'quantas personas temos?',
    'liste as jornadas').
    
    Args:
        project_id: ID do projeto
        artifact_name: O nome técnico do artefato. Deve ser um dos seguintes:
            - product_canvas
            - goal_sketches
            - personas
            - journeys
            - stories
            - overall_model_classes
            - prioritizations
            - change_requests
            - epic_stories
            - business_rules
            - usage_scenarios
            - system_interfaces
            - storyboards
            - sprint
            - product_backlog
            - interviews
    """
    print(f"🔎 --- Tool Call: get_data_from_artifact(artifact='{artifact_name}', project_id={project_id}) ---")
    if not LARAVEL_API_KEY:
        return "Erro de configuração: PYTHON_SERVICE_API_KEY não definida no .env"

    valid_artifacts = [
        "product_canvas",
        "goal_sketches",
        "personas",
        "journeys",
        "stories",
        "overall_model_classes",
        "prioritizations",
        "change_requests",
        "epic_stories",
        "business_rules",
        "usage_scenarios",
        "system_interfaces",
        "storyboards",
        "sprint",
        "product_backlog",
        "interviews"
    ]
    
    if artifact_name not in valid_artifacts:
        print(f"Artefato '{artifact_name}' inválido. Fora da lista da tool: {', '.join(valid_artifacts)}")
        return {
            "error": f"Artefato '{artifact_name}' inválido. Escolha entre: {', '.join(valid_artifacts)}"
        }
    
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
        # print("--- Resposta da Ferramenta (JSON): ---")
        # print(response.json())
        wait_for_all_tracers()

        raw_data = response.json()
        clean_data = sanitize_data(raw_data)
        print(f"✅ Dados limpos recebidos(ARTIFACTS). Tamanho reduzido de {len(str(raw_data))} para {len(str(clean_data))} caracteres.")
        print("-" * 80)
        print(json.dumps(clean_data, indent=4, ensure_ascii=False ))
        print("-" * 80)
        # print(f"✅ Dados SUJOS.")
        # print(json.dumps(raw_data, indent=4, ensure_ascii=False))
        # print("-" * 80)
        
        return json.dumps(clean_data, ensure_ascii=False)
    except requests.exceptions.HTTPError as e:
        print(f"Erro HTTP: {e.response.text}")
        return f"Erro ao buscar dados: {e.response.status_code} - {e.response.text}"
    except Exception as e:
        print(f"Erro inesperado na ferramenta: {str(e)}")
        return f"Erro ao chamar a ferramenta: {str(e)}"

@tool
def get_data_from_interview(artifact_name: str, project_id: int) -> str:
    """
    Busca os dados (em JSON) de entrevistas de requisitos
    de um projeto no backend principal do Laravel.
    Use esta ferramenta sempre.
    
    Args:
        project_id: ID do projeto
        artifact_name: interviews
    """
    print(f"🔎 --- Tool Call: get_data_from_interview(artifact='{artifact_name}', project_id={project_id}) ---")
    if not LARAVEL_API_KEY:
        return "Erro de configuração: PYTHON_SERVICE_API_KEY não definida no .env"

    valid_artifacts = [
        "interviews"
    ]
    
    if artifact_name not in valid_artifacts:
        print(f"Artefato '{artifact_name}' inválido. Fora da lista da tool: {', '.join(valid_artifacts)}")
        return {
            "error": f"Artefato '{artifact_name}' inválido. Escolha entre: {', '.join(valid_artifacts)}"
        }
    
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
        # print("--- Resposta da Ferramenta (JSON): ---")
        # print(response.json())
        wait_for_all_tracers()

        raw_data = response.json()
        clean_data = sanitize_data(raw_data)
        print(f"✅ Dados limpos recebidos(INTERVIEW). Tamanho reduzido de {len(str(raw_data))} para {len(str(clean_data))} caracteres.")
        print("-" * 80)
        print(json.dumps(clean_data, indent=4, ensure_ascii=False ))
        print("-" * 80)
        # print(f"✅ Dados SUJOS.")
        # print(json.dumps(raw_data, indent=4, ensure_ascii=False))
        # print("-" * 80)
        
        return json.dumps(clean_data, ensure_ascii=False)
    except requests.exceptions.HTTPError as e:
        print(f"Erro HTTP: {e.response.text}")
        return f"Erro ao buscar dados: {e.response.status_code} - {e.response.text}"
    except Exception as e:
        print(f"Erro inesperado na ferramenta: {str(e)}")
        return f"Erro ao chamar a ferramenta: {str(e)}"


tools = [get_data_from_artifact, search_knowledge_base, get_data_from_interview]

def sanitize_data(data):
    """
    Remove campos técnicos do Laravel (timestamps, soft deletes, pivots)
    para limpar o contexto enviado para a IA.
    """
    if isinstance(data, dict):
        # Lista de campos para remover
        keys_to_remove = [
            'created_at', 'updated_at', 'deleted_at', 'email_verified_at', 
            'two_factor_secret', 'two_factor_recovery_codes', 'remember_token',
            'profile_photo_path', 'email', 'pivot', 'email_verified_at'
        ]
        return {
            k: sanitize_data(v) 
            for k, v in data.items() 
            if k not in keys_to_remove and v is not None
        }
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    else:
        return data
    
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
    system_prompt_content = f"""Você é um Assistente de IA atuando como **Facilitador** da metodologia ágil de requisitos REACT-M. Seu papel **NÃO** é apenas responder perguntas, mas **agir como um coach e guia,** para o usuário, conforme descrito na metodologia.

    **Ferramentas Disponíveis:**
    1. Para dados do banco de dados do projeto relacionados aos artefatos e cerimônias inclusive as entrevistas de requisitos, acesse `get_data_from_artifact`.
    2. Para embasamento teórico e metodológico e especialmente, para entender exatamente qual seu papel durante as interações com o usuário se comportantodo como o Facilitator, use `search_knowledge_base`.
    2. Para acessar as entrevistas de requisitos do sistema que o usuario quer desenvolver use `get_data_from_interview`.
    
    **REGRAS CRÍTICAS DE APRESENTAÇÃO :**
    1.JAMAIS mostre ao usuário chaves de JSON, nomes de colunas de banco ou termos em snake_case (ex: não escreva `goal_sketches`, `product_id`, `is_active`...).
    2. **Tradução Natural:** Ao ler o JSON da ferramenta, traduza os campos para linguagem natural antes de responder.
        - product_canvas -> Canvas do Produto
        - goal_sketches -> Objetivos do Produto
        - personas -> Personas do Produto
        - journeys -> Jornadas do Produto(Journeys)
        - stories -> Estórias do Produto
        - overall_model_classes -> Cartões de Colaboração de Responsabilidade de Classe
        - prioritizations -> Matriz de Priorizações de Estórias com Objetivos
        - change_requests -> Soliciações de Mudanças de Estórias
        - epic_stories -> Estórias Épicas do Produto
        - business_rules -> Regras de Negócios das Estórias do Produto
        - usage_scenarios -> Cenários de Uso das Estórias do Produto
        - system_interfaces -> Interfaces de Sistema do Produto
        - storyboards -> Roteiro Visual de Estórias do Produto
        - sprint -> Sprints do Produto
        - product_backlog -> Backlog do Produto
        - interviews -> Entrevistas do Produto
    3. **Formatação:** Nunca despeje o JSON cru na resposta.

    **Seu Objetivo (O Papel do Facilitador):** 
    Guiar um usuário a aplicar o REACT-M da melhor forma possível. Você deve ser proativo, colaborativo e ajudar a executar as cerimônias e preencher os artefatos.

    **Instruções de Ferramentas:**
    1  SEMPRE USE A FERRAMENTA `search_knowledge_base`
    2. SEMPRE USE A FERRAMENTA `get_data_from_interview`
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
    - ID: {project_id} (Não exponha esse dados para o Usuário nem solicite dele)

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