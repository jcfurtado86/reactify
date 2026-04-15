from config import Config
from .base import Transcriber


def build_transcriber() -> Transcriber:
    provider = (Config.TRANSCRIBER_PROVIDER or "local").lower()

    if provider == "local":
        from .local_whisper import LocalWhisperTranscriber
        return LocalWhisperTranscriber()

    if provider == "openai":
        from .openai_whisper import OpenAIWhisperTranscriber
        return OpenAIWhisperTranscriber()

    raise RuntimeError(
        f"TRANSCRIBER_PROVIDER inválido: {provider!r}. "
        "Valores suportados: 'local', 'openai'."
    )
