import os
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

# Bibliotecas do LangChain e Vetores
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_postgres import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

# Docling para processamento de arquivos
from docling.document_converter import DocumentConverter

# Configuração do Modelo de Embeddings Local (O mesmo do seu hf.py)
MODEL_NAME = "BAAI/bge-m3"
MODEL_PATH = ".hf_models" # Ajuste se o caminho for diferente
model_kwargs = {'device': 'cpu'} # Mude para 'cuda' se tiver GPU NVIDIA configurada
encode_kwargs = {'normalize_embeddings': True}

print(f"🔄 Carregando modelo de embeddings: {MODEL_NAME}...")
embeddings = HuggingFaceEmbeddings(
    model_name=MODEL_PATH, # Aponta para a pasta local onde você salvou
    model_kwargs=model_kwargs,
    encode_kwargs=encode_kwargs
)

# Configuração do Banco de Dados (PGVector)
# Nota: O 'collection_name' separa diferentes conjuntos de documentos no mesmo banco
connection_string = os.getenv("DATABASE_URL")
collection_name = "react"

vector_store = PGVector(
    embeddings=embeddings,
    collection_name=collection_name,
    connection=connection_string,
    use_jsonb=True,
)

def process_and_ingest(file_path):
    print(f"📄 Processando arquivo: {file_path}")
    
    # 1. Converter PDF para Markdown usando Docling
    converter = DocumentConverter()
    result = converter.convert(file_path)
    doc_content = result.document.export_to_markdown()
    
    # 2. Criar Objeto Documento do LangChain
    # Adicionamos metadados para saber a origem depois
    raw_doc = Document(
        page_content=doc_content,
        metadata={"source": file_path}
    )
    
    # 3. Dividir o texto em pedaços (Chunks)
    # Chunk size 1000 é um padrão seguro. Overlap ajuda a manter contexto entre pedaços.
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", " ", ""]
    )
    chunks = text_splitter.split_documents([raw_doc])
    
    print(f"✂️  Documento dividido em {len(chunks)} pedaços.")
    
    # 4. Salvar no Postgres
    print("💾 Salvando vetores no banco de dados...")
    vector_store.add_documents(chunks)
    print("✅ Ingestão concluída com sucesso!")

if __name__ == "__main__":
    # Teste direto: Ajuste o caminho para um PDF real que você tenha aí
    file_test = "react_m/Dissertacao_Bleno_VersaoFinal.pdf"
    
    if os.path.exists(file_test):
        process_and_ingest(file_test)
    else:
        print(f"⚠️ Arquivo de teste não encontrado: {file_test}")
        print("Por favor, ajuste a variável 'file_test' no final do script.")