"""
Backend de transcrição local via faster-whisper.

Carrega o modelo uma vez no __init__ (custo alto na primeira startup, zero
no uso recorrente). Roda em CPU com compute_type=int8 por default pra caber
no Beelink sem GPU.
"""
from config import Config


class LocalWhisperTranscriber:
    name = "local"

    def __init__(self) -> None:
        # Import tardio: só quando este backend for realmente escolhido,
        # pra não forçar faster-whisper como dep obrigatória de quem roda
        # só com TRANSCRIBER_PROVIDER=openai.
        from faster_whisper import WhisperModel

        print(
            f"[local_whisper] Carregando modelo '{Config.WHISPER_MODEL_SIZE}' "
            f"(compute_type={Config.WHISPER_COMPUTE_TYPE}, "
            f"cache={Config.WHISPER_MODEL_DIR})..."
        )
        self._model = WhisperModel(
            Config.WHISPER_MODEL_SIZE,
            device="cpu",
            compute_type=Config.WHISPER_COMPUTE_TYPE,
            download_root=Config.WHISPER_MODEL_DIR,
        )
        print("[local_whisper] Modelo carregado.")

    def transcribe(self, file_path: str) -> str:
        language = Config.WHISPER_LANGUAGE or None
        segments, _info = self._model.transcribe(
            file_path,
            language=language,
            vad_filter=True,
        )
        # segments é um generator; consumir e concatenar.
        parts = [seg.text.strip() for seg in segments if seg.text]
        return " ".join(parts)
