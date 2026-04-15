from config import Config
from .base import PostProcessor


def build_postprocessor() -> PostProcessor:
    provider = (Config.POSTPROCESSOR_PROVIDER or "noop").lower()

    if provider == "noop":
        from .noop import NoopPostProcessor
        return NoopPostProcessor()

    if provider == "qwen_ollama":
        from .qwen_ollama import QwenOllamaPostProcessor
        return QwenOllamaPostProcessor()

    raise RuntimeError(
        f"POSTPROCESSOR_PROVIDER inválido: {provider!r}. "
        "Valores suportados: 'noop', 'qwen_ollama'."
    )
