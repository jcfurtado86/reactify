# import os
# import whisper
# import requests
# import pdfplumber
# from flask import Flask, request, jsonify
# from dotenv import load_dotenv

# load_dotenv()

# app = Flask(__name__)

# MODEL_DIR = "py_service/.whisper_models"
# os.makedirs(MODEL_DIR, exist_ok=True) 

# print("Carregando o modelo Whisper...")
# # Size | Parameters | English-only model | Multilingual model | Required VRAM | Relative speed
# # tiny | 39 M | tiny.en | tiny | ~1 GB | ~10x
# # base | 74 M | base.en | base | ~1 GB | ~7x
# # small | 244 M | small.en | small | ~2 GB | ~4x
# # medium | 769 M | medium.en | medium | ~5 GB | ~2x
# # large | 1550 M | N/A | large | ~10 GB | 1x
# # turbo | 809 M | N/A | turbo | ~6 GB | ~8x

# model = whisper.load_model("medium", download_root=MODEL_DIR, device="cpu") #para rodar na cpu: device="cpu"

# @app.route('/transcribe', methods=['POST'])
# def transcribe_audio():
#     if not request.json or 'file_url' not in request.json:
#         return jsonify({"error": "Requisição inválida. 'file_url' é obrigatório."}), 400

#     file_url = request.json['file_url']
#     temp_file_path = "temp_downloaded_file.tmp"
    
#     try:
#         print(f"Baixando arquivo de: {file_url}")
#         with requests.get(file_url, stream=True) as r:
#             r.raise_for_status()
#             with open(temp_file_path, 'wb') as f:
#                 for chunk in r.iter_content(chunk_size=8192):
#                     f.write(chunk)
#         print("Download concluído.")

#         file_extension = file_url.split('.')[-1].lower()
#         print(f"Extensão do arquivo detectada: {file_extension}")

#         transcript_text = ""

#         if file_extension in ['mp3', 'mp4']:
#             print("Processando com Whisper (Áudio/Vídeo)...")
#             result = model.transcribe(temp_file_path, fp16=False)
#             transcript_text = result.get('text', '')
        
#         elif file_extension == 'pdf':
#             print("Processando com pdfplumber (PDF)...")
#             text_parts = []
#             with pdfplumber.open(temp_file_path) as pdf:
#                 for page in pdf.pages:
#                     text_parts.append(page.extract_text() or "")
#             transcript_text = "\n".join(text_parts)
        
#         else:
#             return jsonify({"error": f"Tipo de arquivo '{file_extension}' não suportado."}), 415 # HTTP 415: Unsupported Media Type

#         print("Processamento concluído.")
#         return jsonify({"transcript": transcript_text})

#     except requests.exceptions.RequestException as e:
#         return jsonify({"error": f"Falha ao baixar o arquivo: {e}"}), 500
#     except Exception as e:
#         print(f"Erro inesperado: {e}")
#         return jsonify({"error": f"Ocorreu um erro durante o processamento: {e}"}), 500
#     finally:
#         if os.path.exists(temp_file_path):
#             os.remove(temp_file_path)
#             print("Arquivo temporário removido.")

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5001, debug=True)

import os
import requests
import pdfplumber
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from openai import OpenAI
from pydub import AudioSegment

load_dotenv()

app = Flask(__name__)

# Configura o cliente da OpenAI usando a chave do .env
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def process_openai_whisper(file_path):
    # Verifica o tamanho do arquivo em MB
    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
    
    # Se for menor que 24.5MB (margem de segurança), envia direto
    if file_size_mb <= 24.5:
        print("Arquivo dentro do limite. Enviando para OpenAI...")
        with open(file_path, "rb") as audio_file:
            response = client.audio.transcriptions.create(model="whisper-1", file=audio_file)
            return response.text
    
    # Se for maior, precisamos fatiar (chunking)
    print(f"Arquivo de {file_size_mb:.2f}MB detectado. Iniciando fatiamento...")
    audio = AudioSegment.from_file(file_path)
    
    # Fatiar em pedaços de 15 minutos (garante que ficará abaixo de 25MB em formatos compactados)
    chunk_length_ms = 15 * 60 * 1000 
    full_transcript = []
    
    for i, start_ms in enumerate(range(0, len(audio), chunk_length_ms)):
        chunk = audio[start_ms:start_ms + chunk_length_ms]
        chunk_path = f"temp_chunk_{i}.mp3"
        
        # Exporta o pedaço temporário
        chunk.export(chunk_path, format="mp3")
        
        print(f"Enviando parte {i+1} para OpenAI...")
        with open(chunk_path, "rb") as chunk_file:
            response = client.audio.transcriptions.create(model="whisper-1", file=chunk_file)
            full_transcript.append(response.text)
        
        # Limpa o pedaço temporário
        os.remove(chunk_path)
        
    return " ".join(full_transcript)


@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    if not request.json or 'file_url' not in request.json:
        return jsonify({"error": "Requisição inválida. 'file_url' é obrigatório."}), 400

    file_url = request.json['file_url']
    temp_file_path = "temp_downloaded_file.tmp"
    
    try:
        print(f"Baixando arquivo de: {file_url}")
        with requests.get(file_url, stream=True) as r:
            r.raise_for_status()
            with open(temp_file_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        print("Download concluído.")

        file_extension = file_url.split('.')[-1].lower()
        print(f"Extensão do arquivo detectada: {file_extension}")

        transcript_text = ""

        if file_extension in ['mp3', 'mp4']:
            print("Processando com API da OpenAI...")
            transcript_text = process_openai_whisper(temp_file_path)
        
        elif file_extension == 'pdf':
            print("Processando com pdfplumber (PDF)...")
            text_parts = []
            with pdfplumber.open(temp_file_path) as pdf:
                for page in pdf.pages:
                    text_parts.append(page.extract_text() or "")
            transcript_text = "\n".join(text_parts)
        
        else:
            return jsonify({"error": f"Tipo de arquivo '{file_extension}' não suportado."}), 415

        print("Processamento concluído.")
        return jsonify({"transcript": transcript_text})

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Falha ao baixar o arquivo: {e}"}), 500
    except Exception as e:
        print(f"Erro inesperado: {e}")
        return jsonify({"error": f"Ocorreu um erro durante o processamento: {e}"}), 500
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            print("Arquivo temporário removido.")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)