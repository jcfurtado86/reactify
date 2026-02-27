#TRANCREVE AUDIOS E VETORIZA TRANSCRICOES 
import os
import json
import whisper
import glob
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_postgres import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

load_dotenv()

# Configurações
DOWNLOAD_DIR = "temp_audio"
TRANSCRIPTIONS_DIR = "transcriptions"
MODEL_DIR = ".whisper_models"
HF_MODEL_PATH = ".hf_models"

os.makedirs(TRANSCRIPTIONS_DIR, exist_ok=True)

# 1. Configuração do Banco e Embeddings
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

# 2. Carrega Modelo Whisper
print("🎧 Carregando modelo Whisper...")
whisper_model = whisper.load_model("large", download_root=MODEL_DIR, device="cpu")

def get_metadata(file_path_base):
    """
    Tenta ler o arquivo .info.json gerado pelo yt-dlp para pegar Título e URL reais.
    Se não existir, usa o nome do arquivo.
    """
    json_path = f"{file_path_base}.info.json"
    meta = {"source": "Desconhecido", "url": "N/A", "title": os.path.basename(file_path_base)}
    
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                meta["source"] = f"YouTube: {data.get('title')}"
                meta["title"] = data.get('title')
                meta["url"] = data.get('webpage_url')
        except Exception as e:
            print(f"⚠️ Erro ao ler metadados JSON: {e}")
    
    return meta

def ingest_files():
    # Lista todos os mp3 na pasta de downloads
    audio_files = glob.glob(os.path.join(DOWNLOAD_DIR, "*.mp3"))
    
    if not audio_files:
        print("📭 Nenhum arquivo de áudio encontrado para processar.")
        return

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

    print(f"🚀 Encontrados {len(audio_files)} arquivos para processar.")

    for audio_path in audio_files:
        try:
            file_base = os.path.splitext(audio_path)[0] # Remove a extensão .mp3
            metadata = get_metadata(file_base)
            title = metadata["title"]
            
            print(f"\n🎙️  Transcrevendo: {title}...")
            
            # Transcrição
            result = whisper_model.transcribe(audio_path)
            transcription_text = result["text"]

            # Salva Backup TXT
            # Usamos o ID do arquivo para o txt para evitar erros de caracteres no nome
            txt_filename = f"{os.path.basename(file_base)}.txt"
            txt_path = os.path.join(TRANSCRIPTIONS_DIR, txt_filename)
            
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(f"URL: {metadata['url']}\n")
                f.write(f"Título: {title}\n")
                f.write("-" * 40 + "\n")
                f.write(transcription_text)
            
            print(f"📝 Backup salvo: {txt_path}")
            
            # Cria documento LangChain
            doc = Document(
                page_content=transcription_text,
                metadata=metadata
            )
            
            # Chunking e Ingestão
            chunks = text_splitter.split_documents([doc])
            print(f"💾 Salvando {len(chunks)} trechos no banco...")
            vector_store.add_documents(chunks)
            
            # Opcional: Mover ou renomear arquivos processados para não processar de novo
            # shutil.move(audio_path, "processed/") 
            print(f"✅ Processamento concluído para: {title}")

        except Exception as e:
            print(f"❌ Erro ao processar {audio_path}: {e}")

if __name__ == "__main__":
    ingest_files()