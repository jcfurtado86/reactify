# VETORIZA TRANSCRICOES
import os
import glob
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_postgres import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings

load_dotenv()

# Configurações
TRANSCRIPTIONS_DIR = "transcriptions"
HF_MODEL_PATH = ".hf_models"

# Verifica se a pasta existe
if not os.path.exists(TRANSCRIPTIONS_DIR):
    print(f"❌ A pasta '{TRANSCRIPTIONS_DIR}' não foi encontrada.")
    exit()

# 1. Configuração do Banco e Embeddings
print("⚙️  Carregando modelos de Embedding...")
# embeddings = HuggingFaceEmbeddings(
#     model_name=HF_MODEL_PATH,
#     model_kwargs={'device': 'cpu'},
#     encode_kwargs={'normalize_embeddings': True}
# )
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

vector_store = PGVector(
    embeddings=embeddings,
    collection_name="react",
    connection=os.getenv("DATABASE_URL"),
    use_jsonb=True,
)

def parse_transcription_file(file_path):
    """
    Lê o arquivo .txt gerado pelo script anterior.
    Espera-se o formato:
    Linha 1: URL: ...
    Linha 2: Título: ...
    Linha 3: --------------------
    Linha 4+: Conteúdo
    """
    metadata = {
        "source": "Arquivo Local", 
        "title": os.path.basename(file_path),
        "url": "N/A"
    }
    content = ""

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            
            # Verifica se o arquivo tem o cabeçalho esperado (mínimo 3 linhas de header + conteúdo)
            if len(lines) > 3 and lines[0].startswith("URL:") and lines[1].startswith("Título:"):
                raw_url = lines[0].replace("URL:", "").strip()
                raw_title = lines[1].replace("Título:", "").strip()
                
                metadata["url"] = raw_url
                metadata["title"] = raw_title
                metadata["source"] = f"YouTube: {raw_title}" if raw_url != "N/A" else "Arquivo Transcrito"
                
                # O conteúdo começa após a linha tracejada (linha 3 em diante, índice 3)
                content = "".join(lines[3:])
            else:
                # Fallback: Se não tiver o cabeçalho padrão, lê o arquivo inteiro
                content = "".join(lines)
                
    except Exception as e:
        print(f"⚠️ Erro ao ler {file_path}: {e}")
        return None, None

    return content, metadata

def ingest_transcriptions():
    # Lista todos os txt na pasta de transcrições
    txt_files = glob.glob(os.path.join(TRANSCRIPTIONS_DIR, "*.txt"))
    
    if not txt_files:
        print("📭 Nenhum arquivo de texto encontrado na pasta de transcrições.")
        return

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

    print(f"🚀 Encontrados {len(txt_files)} arquivos para processar.")

    for txt_path in txt_files:
        try:
            print(f"\n📄 Processando: {os.path.basename(txt_path)}...")
            
            content, metadata = parse_transcription_file(txt_path)
            
            if not content:
                print(f"⚠️ Arquivo vazio ou ilegível: {txt_path}")
                continue

            # Cria documento LangChain
            doc = Document(
                page_content=content,
                metadata=metadata
            )
            
            # Chunking
            chunks = text_splitter.split_documents([doc])
            
            if not chunks:
                print("⚠️ Nenhum trecho gerado (conteúdo muito curto?).")
                continue

            print(f"💾 Salvando {len(chunks)} trechos no banco...")
            
            # Ingestão
            vector_store.add_documents(chunks)
            
            print(f"✅ Ingestão concluída para: {metadata['title']}")

        except Exception as e:
            print(f"❌ Erro ao processar {txt_path}: {e}")

if __name__ == "__main__":
    ingest_transcriptions()