from typing import Protocol


class PostProcessor(Protocol):
    """Contrato mínimo de um backend de limpeza/estruturação de texto."""

    name: str

    def clean(self, text: str) -> str:
        """Recebe o texto cru (de pdfplumber ou whisper) e devolve o limpo."""
        ...
