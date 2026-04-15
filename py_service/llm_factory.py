"""
Factory de LLM compartilhado entre agent (chat) e qualquer outro consumidor
do py_service. Lê o env var `LLM_PROVIDER` — o mesmo que o Laravel usa pra
escolher provider na factory de artefatos, mantendo os 3 vetores (artefato +
cleanup de transcript + chat) sob o mesmo switch.

Retorna instâncias do LangChain já configuradas, prontas pra passar em
`create_agent(model=...)`. Os 3 providers (Gemini, Claude, Ollama) seguem o
mesmo protocol do LangChain, então o agent.py fica agnóstico.
"""
import os


def build_llm(temperature: float = 0.7):
    provider = (os.getenv("LLM_PROVIDER") or "gemini").lower()

    if provider in ("gemini", "google_genai"):
        from langchain_google_genai import ChatGoogleGenerativeAI
        model = os.getenv("LLM_GEMINI_MODEL", "gemini-2.5-flash")
        return ChatGoogleGenerativeAI(
            model=model,
            temperature=temperature,
        )

    if provider == "claude":
        from langchain_anthropic import ChatAnthropic
        model = os.getenv("LLM_CLAUDE_MODEL", "claude-haiku-4-5-20251001")
        return ChatAnthropic(
            model=model,
            temperature=temperature,
            api_key=os.getenv("ANTHROPIC_API_KEY"),
        )

    if provider == "ollama":
        from langchain_ollama import ChatOllama
        model = os.getenv("LLM_OLLAMA_MODEL", "qwen3:8b")
        return ChatOllama(
            model=model,
            temperature=temperature,
            base_url=os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434"),
        )

    raise RuntimeError(
        f"LLM_PROVIDER inválido: {provider!r}. "
        "Valores aceitos: 'gemini', 'claude', 'ollama'."
    )
