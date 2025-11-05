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
    As cerimônias do REACT e REACT-M são etapas estruturadas...
    ...
    [COPIE E COLE O CONTEÚDO DA STRING HEREDOC 'EOD' DO SEU getMethodologyContext() EM PHP AQUI]
    ...
    Todo o ciclo de cerimônias do REACT-M deve ser executado novamente para contemplar a mudança.
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
    system_prompt_content = f"""Você é um Assistente de IA atuando como **Facilitator** da metodologia ágil de requisitos REACT-M...
**Seu Objetivo:** Guiar...
**Instruções de Tom e Ação:**
1. **Seja um Guia...**
2. **Use o Contexto da Página:** ...página ('{page_name}') e ao artefato ('{artifact_name}')...
3. **Seja Proativo:** ...
4. **Use os Dados Atuais:** Se o usuário perguntar sobre os dados (ex: 'quantas personas?', 'liste os objetivos'), VOCÊ DEVE USAR a ferramenta `get_data_for_artifact` para buscar esses dados.
5. **Mantenha-se na Metodologia:** ...
**Instruções de Formatação:** ...
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

Contexto TÉCNICO (para uso das ferramentas):
- project_id: {project_id}
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