"""
Backend de transcrição via OpenAI Whisper API.

Mantido como alternativa paga/remota. Usa o mesmo padrão de chunking de
25MB que o código original tinha em interview_service.py.
"""
import os
from openai import OpenAI
from pydub import AudioSegment

from config import Config


class OpenAIWhisperTranscriber:
    name = "openai"

    def __init__(self) -> None:
        if not Config.OPENAI_API_KEY:
            raise RuntimeError(
                "OPENAI_API_KEY não configurada. Defina no .env ou troque "
                "TRANSCRIBER_PROVIDER para 'local'."
            )
        self._client = OpenAI(api_key=Config.OPENAI_API_KEY)

    def transcribe(self, file_path: str) -> str:
        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)

        # Limite da API é 25MB. Margem de segurança em 24.5.
        if file_size_mb <= 24.5:
            with open(file_path, "rb") as audio_file:
                response = self._client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                )
                return response.text

        # Arquivo grande: fatiar em pedaços de 15 min (fica abaixo de 25MB
        # em mp3 comprimido) e concatenar as transcrições.
        print(f"[openai_whisper] Arquivo de {file_size_mb:.2f}MB, fatiando...")
        audio = AudioSegment.from_file(file_path)
        chunk_length_ms = 15 * 60 * 1000
        parts: list[str] = []

        for i, start_ms in enumerate(range(0, len(audio), chunk_length_ms)):
            chunk = audio[start_ms:start_ms + chunk_length_ms]
            chunk_path = f"temp_chunk_{i}.mp3"
            chunk.export(chunk_path, format="mp3")
            try:
                with open(chunk_path, "rb") as f:
                    response = self._client.audio.transcriptions.create(
                        model="whisper-1",
                        file=f,
                    )
                    parts.append(response.text)
            finally:
                if os.path.exists(chunk_path):
                    os.remove(chunk_path)

        return " ".join(parts)
