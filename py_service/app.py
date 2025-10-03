import os
import whisper
import requests
import pdfplumber
import docx
from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

MODEL_DIR = ".whisper_models"
os.makedirs(MODEL_DIR, exist_ok=True) 

print("Carregando o modelo Whisper...")
# Size | Parameters | English-only model | Multilingual model | Required VRAM | Relative speed
# tiny | 39 M | tiny.en | tiny | ~1 GB | ~10x
# base | 74 M | base.en | base | ~1 GB | ~7x
# small | 244 M | small.en | small | ~2 GB | ~4x
# medium | 769 M | medium.en | medium | ~5 GB | ~2x
# large | 1550 M | N/A | large | ~10 GB | 1x
# turbo | 809 M | N/A | turbo | ~6 GB | ~8x

model = whisper.load_model("medium", download_root=MODEL_DIR) #para rodar na cpu: device="cpu"

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

        if file_extension in ['mp3', 'wav', 'ogg', 'm4a', 'mp4', 'mov', 'webm']:
            print("Processando com Whisper (Áudio/Vídeo)...")
            result = model.transcribe(temp_file_path, fp16=False)
            transcript_text = result.get('text', '')
        
        elif file_extension == 'pdf':
            print("Processando com pdfplumber (PDF)...")
            text_parts = []
            with pdfplumber.open(temp_file_path) as pdf:
                for page in pdf.pages:
                    # Adiciona o texto da página, ou uma string vazia se não houver texto
                    text_parts.append(page.extract_text() or "")
            transcript_text = "\n".join(text_parts)

        elif file_extension == 'docx':
            print("Processando com python-docx (DOCX)...")
            doc = docx.Document(temp_file_path)
            text_parts = [p.text for p in doc.paragraphs]
            transcript_text = "\n".join(text_parts)

        elif file_extension == 'txt':
            print("Processando como arquivo de texto simples (TXT)...")
            with open(temp_file_path, 'r', encoding='utf-8') as f:
                transcript_text = f.read()
        
        else:
            return jsonify({"error": f"Tipo de arquivo '{file_extension}' não suportado."}), 415 # HTTP 415: Unsupported Media Type

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