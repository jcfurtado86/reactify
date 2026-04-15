"""
Ingestão de PDFs na base de conhecimento RAG do chat.

Usa a mesma vector_store de `rag.py` (embeddings + collection do env),
então o `search_knowledge_base` do agente acha o conteúdo sem nenhum
ajuste a mais.

Uso:
    python ingest_docs.py react_m/Dissertacao_Bleno_VersaoFinal.pdf [outro.pdf ...]

Sem args, ingere todo PDF dentro de `react_m/`.
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))
load_dotenv()

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from docling.document_converter import DocumentConverter

from rag import vector_store


def process_and_ingest(file_path: str) -> None:
    print(f"📄 Processando: {file_path}")
    converter = DocumentConverter()
    result = converter.convert(file_path)
    doc_content = result.document.export_to_markdown()

    raw_doc = Document(
        page_content=doc_content,
        metadata={"source": os.path.basename(file_path)},
    )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks = splitter.split_documents([raw_doc])
    print(f"✂️  {len(chunks)} chunks")

    vector_store.add_documents(chunks)
    print(f"✅ Ingerido: {file_path}")


def _default_targets() -> list[str]:
    base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "react_m")
    if not os.path.isdir(base):
        return []
    return sorted(
        os.path.join(base, f)
        for f in os.listdir(base)
        if f.lower().endswith(".pdf")
    )


if __name__ == "__main__":
    targets = sys.argv[1:] or _default_targets()
    if not targets:
        print("⚠️  Nenhum PDF informado e react_m/ vazio.")
        sys.exit(1)

    for path in targets:
        if not os.path.exists(path):
            print(f"⚠️  Não encontrado: {path}")
            continue
        process_and_ingest(path)
