"""
Configuração centralizada do py_service.

Toda variável de ambiente lida pelos módulos do py_service (chat_service,
interview_service, scripts de ingestão) deve vir daqui. Isso evita que
fallbacks ad-hoc se espalhem pelo código e dá um único ponto de verdade
sobre o que é obrigatório.

Chamar `Config.validate()` na startup para falhar rápido se algo crítico
estiver faltando.
"""
import os
from dotenv import load_dotenv

load_dotenv()


def _bool_env(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).lower() in {"1", "true", "yes", "on"}


class Config:
    # --- LLM / provider ---
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")
    LLM_MODEL = os.getenv("LLM_MODEL") or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.7"))

    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://192.168.0.101:11434")

    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

    # --- Embeddings / RAG ---
    EMBEDDINGS_SPEC = os.getenv("EMBEDDINGS_SPEC", "openai:text-embedding-3-small")
    PGVECTOR_COLLECTION = os.getenv("PGVECTOR_COLLECTION", "react")
    DATABASE_URL = os.getenv("DATABASE_URL", "")

    # --- Laravel bridge ---
    LARAVEL_TOOL_API_URL = os.getenv("LARAVEL_TOOL_API_URL", "")
    PYTHON_SERVICE_API_KEY = os.getenv("PYTHON_SERVICE_API_KEY", "")

    # --- Debug / observability ---
    LANGCHAIN_DEBUG = _bool_env("LANGCHAIN_DEBUG", False)
    FLASK_DEBUG = _bool_env("FLASK_DEBUG", True)

    # --- Portas dos serviços Flask ---
    CHAT_SERVICE_PORT = int(os.getenv("CHAT_SERVICE_PORT", "5002"))
    INTERVIEW_SERVICE_PORT = int(os.getenv("INTERVIEW_SERVICE_PORT", "5001"))

    @classmethod
    def validate(cls, required: list[str] | None = None) -> None:
        """
        Confere que as variáveis obrigatórias estão presentes.
        Chamar na startup do serviço (depois de importar Config) para
        falhar rápido com mensagem clara.
        """
        defaults = [
            "DATABASE_URL",
            "LARAVEL_TOOL_API_URL",
            "PYTHON_SERVICE_API_KEY",
        ]
        missing = [k for k in (required or defaults) if not getattr(cls, k)]
        if missing:
            raise RuntimeError(
                f"Config obrigatória ausente: {', '.join(missing)}. "
                "Defina no .env antes de iniciar o serviço."
            )
