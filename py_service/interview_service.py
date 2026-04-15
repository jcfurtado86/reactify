"""
Entrypoint Flask do serviço de extração de entrevistas.

Responsabilidades:
1. Baixar o arquivo do Cloudinary.
2. Extrair texto cru (pdfplumber pra PDF, transcriber configurado pra
   áudio/vídeo).
3. Passar o texto cru pelo postprocessor configurado (Qwen via Ollama,
   noop, etc).
4. Devolver os dois campos (transcript_raw e transcript) pro Laravel.

Provider-agnostic: a escolha de transcritor e de postprocessor vem de
env vars via Config (ver py_service/config.py). Pra trocar, basta flipar
a env e reiniciar o serviço.
"""
import os
import time

import pdfplumber
import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request

# Carrega primeiro o .env do Laravel (pai), depois o local do py_service
# se existir. Fonte única de verdade: o Laravel .env.
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))
load_dotenv()

from config import Config
from postprocessors import build_postprocessor
from transcribers import build_transcriber

app = Flask(__name__)

# Instancia os backends uma vez na startup do processo. Falha rápido se
# algum estiver mal configurado.
print(
    f"[interview_service] TRANSCRIBER_PROVIDER={Config.TRANSCRIBER_PROVIDER} "
    f"POSTPROCESSOR_PROVIDER={Config.POSTPROCESSOR_PROVIDER}"
)
transcriber = build_transcriber()
postprocessor = build_postprocessor()
print(
    f"[interview_service] transcriber={transcriber.name} "
    f"postprocessor={postprocessor.name} -> pronto"
)


def _extract_pdf(file_path: str) -> str:
    with pdfplumber.open(file_path) as pdf:
        parts = [page.extract_text() or "" for page in pdf.pages]
    return "\n".join(parts)


@app.route("/transcribe", methods=["POST"])
def transcribe():
    if not request.json or "file_url" not in request.json:
        return (
            jsonify({"error": "Requisição inválida. 'file_url' é obrigatório."}),
            400,
        )

    file_url = request.json["file_url"]
    temp_file_path = "temp_downloaded_file.tmp"

    try:
        print(f"[interview_service] baixando {file_url}")
        t0 = time.time()
        with requests.get(file_url, stream=True) as r:
            r.raise_for_status()
            with open(temp_file_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        print(f"[interview_service] download ok em {time.time() - t0:.1f}s")

        file_extension = file_url.split(".")[-1].lower()
        print(f"[interview_service] extensão: {file_extension}")

        # --- Estágio 1: extração ---
        t0 = time.time()
        if file_extension == "pdf":
            raw_text = _extract_pdf(temp_file_path)
        elif file_extension in ("mp3", "mp4"):
            raw_text = transcriber.transcribe(temp_file_path)
        else:
            return (
                jsonify({"error": f"Tipo de arquivo '{file_extension}' não suportado."}),
                415,
            )
        print(
            f"[interview_service] extração ok em {time.time() - t0:.1f}s "
            f"({len(raw_text)} chars)"
        )

        # --- Estágio 2: pós-processamento ---
        t0 = time.time()
        final_text = postprocessor.clean(raw_text)
        print(
            f"[interview_service] postproc ({postprocessor.name}) ok em "
            f"{time.time() - t0:.1f}s ({len(final_text)} chars)"
        )

        return jsonify({
            "transcript_raw": raw_text,
            "transcript": final_text,
        })

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Falha ao baixar o arquivo: {e}"}), 500
    except Exception as e:
        print(f"[interview_service] erro inesperado: {e}")
        return jsonify({"error": f"Erro durante o processamento: {e}"}), 500
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=Config.INTERVIEW_SERVICE_PORT, debug=False)
