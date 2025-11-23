import os
import yt_dlp
import whisper
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_postgres import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
import re

load_dotenv()

# 1. Configurações
LINKS_FILE = "react_m/links.txt" # Seu arquivo enviado
HF_MODEL_PATH = ".hf_models"
TEMP_AUDIO_DIR = "temp_audio"
TRANSCRIPTIONS_DIR = "transcriptions"
MODEL_DIR = ".whisper_models"

os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)
os.makedirs(TRANSCRIPTIONS_DIR, exist_ok=True)

# 2. Configuração do Banco (Igual ao ingest_database.py)
embeddings = HuggingFaceEmbeddings(
    model_name=HF_MODEL_PATH,
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)
vector_store = PGVector(
    embeddings=embeddings,
    collection_name="react",
    connection=os.getenv("DATABASE_URL"),
    use_jsonb=True,
)

# 3. Carrega Modelo Whisper (Pode demorar na 1ª vez)
print("🎧 Carregando modelo Whisper (pode levar um tempo)...")
whisper_model = whisper.load_model("large", download_root=MODEL_DIR, device="cpu") #para rodar na cpu: device="cpu"
 # Use "small" ou "medium" se tiver boa CPU/GPU

def sanitize_filename(name):
    """Remove caracteres proibidos em nomes de arquivos (ex: / \ ? :)"""
    return re.sub(r'[\\/*?:"<>|]', "", name).strip()

def download_audio(url):
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{'key': 'FFmpegExtractAudio','preferredcodec': 'mp3','preferredquality': '192'}],
        'outtmpl': f'{TEMP_AUDIO_DIR}/%(id)s.%(ext)s',
        'quiet': True
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        return os.path.join(TEMP_AUDIO_DIR, f"{info['id']}.mp3"), info['title']

def process_links():
    with open(LINKS_FILE, 'r') as f:
        urls = [line.strip() for line in f.readlines() if line.strip()]

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

    for url in urls:
        try:
            print(f"\n⬇️  Baixando: {url}")
            audio_path, title = download_audio(url)
            safe_title = sanitize_filename(title)
            
            print(f"🎙️  Transcrevendo: {title}...")
            result = whisper_model.transcribe(audio_path)
            transcription_text = result["text"]

            txt_filename = f"{safe_title}.txt"
            txt_path = os.path.join(TRANSCRIPTIONS_DIR, txt_filename)
            
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(f"URL: {url}\n")
                f.write(f"Título: {title}\n")
                f.write("-" * 40 + "\n")
                f.write(transcription_text)
            print(f"📝 Backup salvo em: {txt_path}")
            
            # Cria documento LangChain
            doc = Document(
                page_content=transcription_text,
                metadata={"source": f"YouTube: {title}", "url": url}
            )
            
            # Chunking e Ingestão
            chunks = text_splitter.split_documents([doc])
            print(f"💾 Salvando {len(chunks)} trechos no banco...")
            vector_store.add_documents(chunks)
            
            # Limpeza
            # os.remove(audio_path)
            # print("✅ Concluído.")
            
        except Exception as e:
            print(f"❌ Erro ao processar {url}: {e}")

        # finally:
        #     Garante que o áudio temporário seja apagado mesmo se der erro
        #     if audio_path and os.path.exists(audio_path):
        #         os.remove(audio_path)

if __name__ == "__main__":
    process_links()