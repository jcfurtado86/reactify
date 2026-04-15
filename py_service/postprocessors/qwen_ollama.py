"""
Backend de pós-processamento via Qwen3 rodando no Ollama local.

Limpa o texto cru extraído de PDF/áudio preservando 100% do conteúdo.
O think mode do Qwen3 é sempre desligado pra cortar latência em CPU.

Timeout generoso (config.POSTPROCESSOR_TIMEOUT, default 600s por chunk).
Se Ollama falhar, devolve o texto cru como fallback pra não quebrar o
pipeline inteiro.
"""
import re
import logging

import requests

from config import Config


log = logging.getLogger(__name__)


# Chunking: limite conservador pro contexto do Qwen3. O modelo aceita mais,
# mas CPU fica inviável. ~24k chars ≈ ~6-8k tokens de input.
MAX_CHARS_PER_CHUNK = 24000
CHUNK_OVERLAP = 500


SYSTEM_PROMPT = (
    "Você é um assistente que recebe texto cru extraído automaticamente de "
    "um PDF ou transcrição de áudio de entrevistas de requisitos de software. "
    "O texto pode ter:\n"
    "- quebras de linha erradas no meio de frases\n"
    "- cabeçalhos e rodapés repetidos\n"
    "- pontuação ausente (comum em transcrições Whisper)\n"
    "- ordem de colunas bagunçada\n"
    "- espaços estranhos\n\n"
    "Sua tarefa é reorganizar o texto para:\n"
    "- Parágrafos corretos com pontuação adequada\n"
    "- Remover cabeçalhos/rodapés que se repetem\n"
    "- Usar markdown leve (apenas **negrito** e listas) quando fizer sentido\n\n"
    "REGRAS ABSOLUTAS:\n"
    "- PRESERVE 100% do conteúdo original. Não resuma, não corte, não omita nada.\n"
    "- NÃO invente, não acrescente informação que não esteja no texto original.\n"
    "- NÃO comente, não explique, não adicione cabeçalhos seus.\n"
    "- Responda APENAS com o texto limpo, nada mais.\n"
)


class QwenOllamaPostProcessor:
    name = "qwen_ollama"

    def __init__(self) -> None:
        self._base_url = Config.OLLAMA_BASE_URL.rstrip("/")
        self._model = Config.POSTPROCESSOR_MODEL
        self._think = Config.POSTPROCESSOR_THINK
        self._timeout = Config.POSTPROCESSOR_TIMEOUT
        print(
            f"[qwen_ollama] base_url={self._base_url} model={self._model} "
            f"think={self._think} timeout={self._timeout}s"
        )

    def clean(self, text: str) -> str:
        if not text or not text.strip():
            return text

        try:
            if len(text) <= MAX_CHARS_PER_CHUNK:
                return self._clean_single(text)
            return self._clean_chunked(text)
        except Exception as e:
            log.exception("Falha no pós-processamento; caindo pro texto cru: %s", e)
            return text

    # ------------------------------------------------------------------

    def _clean_single(self, text: str) -> str:
        prompt = self._build_prompt(text)
        payload = {
            "model": self._model,
            "prompt": prompt,
            "stream": False,
            "think": self._think,  # ollama >= 0.12 aceita
            "options": {
                "temperature": 0.1,
                "num_ctx": 32768,
            },
        }
        response = requests.post(
            f"{self._base_url}/api/generate",
            json=payload,
            timeout=self._timeout,
        )
        response.raise_for_status()
        data = response.json()
        raw = data.get("response", "")
        return self._strip_think(raw).strip()

    def _clean_chunked(self, text: str) -> str:
        chunks = self._split(text)
        print(f"[qwen_ollama] texto com {len(text)} chars, {len(chunks)} chunks")
        cleaned_parts: list[str] = []
        for i, chunk in enumerate(chunks, start=1):
            print(f"[qwen_ollama] chunk {i}/{len(chunks)} ({len(chunk)} chars)")
            cleaned_parts.append(self._clean_single(chunk))
        return "\n\n".join(cleaned_parts)

    def _split(self, text: str) -> list[str]:
        chunks: list[str] = []
        start = 0
        n = len(text)
        while start < n:
            end = min(start + MAX_CHARS_PER_CHUNK, n)
            # Tenta cortar no fim de um parágrafo/linha dentro do chunk.
            if end < n:
                window = text.rfind("\n\n", start, end)
                if window == -1:
                    window = text.rfind("\n", start, end)
                if window != -1 and window > start + MAX_CHARS_PER_CHUNK // 2:
                    end = window
            chunks.append(text[start:end])
            if end >= n:
                break
            start = max(end - CHUNK_OVERLAP, 0)
        return chunks

    def _build_prompt(self, text: str) -> str:
        # Duplo cinto: prefixo /no_think + campo think:false no payload.
        # Versões antigas do Ollama ignoram o payload.think, o prefixo
        # garante o comportamento.
        no_think_prefix = "" if self._think else "/no_think "
        return (
            f"{no_think_prefix}{SYSTEM_PROMPT}\n\n"
            f"Texto original:\n{text}"
        )

    def _strip_think(self, text: str) -> str:
        # Mesmo com think=false, algum modelo pode vazar <think>...</think>.
        # Remove por defesa.
        return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
