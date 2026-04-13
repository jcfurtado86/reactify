"""
Setup do LLM e construção do agente LangChain.
"""
import langchain
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage
from langchain.agents import create_agent
from config import Config
from rag import search_knowledge_base
from tools import make_agent_tools

langchain.debug = Config.LANGCHAIN_DEBUG


def _build_llm():
    """
    Factory do LLM. Por enquanto só suporta Gemini; a migração para Ollama
    (ver MIGRATION_PLAN_OLLAMA.md) adiciona aqui um branch por provider.
    """
    provider = Config.LLM_PROVIDER
    if provider in ("gemini", "google_genai"):
        return ChatGoogleGenerativeAI(
            model=Config.LLM_MODEL,
            temperature=Config.LLM_TEMPERATURE,
        )
    raise RuntimeError(
        f"LLM_PROVIDER não suportado: {provider!r}. "
        "Valores aceitos hoje: 'gemini'."
    )


llm = _build_llm()


def build_chat_history(chat_history_raw):
    """
    Converte o histórico vindo do Laravel (lista de dicts com sender/message)
    para o formato de mensagens do LangChain.
    """
    messages = []
    for message in chat_history_raw:
        content = message.get("message")
        sender = message.get("sender")
        if not content:
            continue
        if sender == "user":
            messages.append(HumanMessage(content=content))
        elif sender in ("bot", "model", "ai", "assistant"):
            messages.append(AIMessage(content=content))
    return messages


def build_agent_for_request(user_id: int, project_id: int, system_prompt: str):
    """
    Cria um agente LangChain já com as tools amarradas ao contexto
    autenticado (user_id/project_id via closure).
    """
    tools = make_agent_tools(
        user_id=user_id,
        project_id=project_id,
        extra_tools=[search_knowledge_base],
    )
    return create_agent(model=llm, tools=tools, system_prompt=system_prompt)


def extract_final_answer(response) -> str:
    """
    Extrai a resposta final da estrutura de retorno do agente LangChain.
    Lida com `content` sendo string ou lista de content blocks (gemini-pro).
    """
    if not response or "messages" not in response or not response["messages"]:
        return ""

    last = response["messages"][-1]
    content = getattr(last, "content", None)
    if content is None:
        return getattr(last, "text", "")

    if isinstance(content, str):
        return content

    if isinstance(content, list) and content:
        first = content[0]
        if isinstance(first, dict) and "text" in first:
            return first["text"]
        return str(content)

    return str(content)
