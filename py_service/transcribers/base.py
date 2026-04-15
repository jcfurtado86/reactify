from typing import Protocol


class Transcriber(Protocol):
    """Contrato mínimo de um backend de transcrição de áudio/vídeo."""

    name: str

    def transcribe(self, file_path: str) -> str:
        """Recebe um caminho local pra arquivo de áudio/vídeo e devolve o texto."""
        ...
