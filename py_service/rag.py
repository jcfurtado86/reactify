"""
Setup do RAG: embeddings, vector store e a tool `search_knowledge_base`.

Isolado do resto para que o chat_service e scripts de ingestão compartilhem
a mesma configuração de store sem duplicar código.
"""
import os
from langchain_openai import OpenAIEmbeddings
from langchain_postgres import PGVector
from langchain.tools import tool
from config import Config

# Garante que GOOGLE_API_KEY esteja populada a partir de GEMINI_API_KEY
# antes de qualquer módulo LangChain tentar ler o env.
if Config.GOOGLE_API_KEY and not os.getenv("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = Config.GOOGLE_API_KEY


def _build_embeddings():
    """
    Escolhe o provider de embeddings via EMBEDDINGS_SPEC no formato `provider:model`.
    Hoje suporta `openai:<model>`; quando a migração Ollama for concluída, basta
    adicionar o branch `ollama:<model>`.
    """
    spec = Config.EMBEDDINGS_SPEC
    if spec.startswith("openai:"):
        model = spec.split(":", 1)[1]
        return OpenAIEmbeddings(model=model)
    raise RuntimeError(
        f"EMBEDDINGS_SPEC inválido ou ainda não suportado: {spec!r}. "
        "Esperado algo como 'openai:text-embedding-3-small'."
    )


print("🔄 Inicializando sistema RAG e Embeddings...")
embeddings = _build_embeddings()

print("🔄 Criando Vector Store...")
vector_store = PGVector(
    embeddings=embeddings,
    collection_name=Config.PGVECTOR_COLLECTION,
    connection=Config.DATABASE_URL,
    use_jsonb=True,
)

retriever = vector_store.as_retriever(search_kwargs={"k": 4})


@tool
def search_knowledge_base(query: str) -> str:
    """
    Use esta ferramenta para buscar informações técnicas em documentos PDF,
    manuais e transcrições de vídeo. Útil para explicar conceitos teóricos do REACT-M.
    """
    print(f"\n🔎 --- Tool Call: search_knowledge_base(query='{query}') ---")

    docs = retriever.invoke(query)
    results = vector_store.similarity_search_with_score(query, k=4)
    print("-" * 70)
    print(f"QUERY: {query}")

    for doc, score in results:
        print(f"   Score: {score:.4f} | Fonte: {doc.metadata.get('source')}")
        print(f"   Texto: {doc.page_content}...")
        print("-" * 70)

    if not docs:
        print("❌ Nenhum documento relevante encontrado.")
        return "Não encontrei informações relevantes na base de conhecimento."

    results_text = []
    print(f"✅ Recuperados {len(docs)} trechos de contexto:\n")

    for i, doc in enumerate(docs):
        source = doc.metadata.get("source", "Desconhecido")
        content_preview = doc.page_content.replace("\n", " ")

        print(f"   [Doc {i + 1}] Fonte: {source}")
        print(f"   [Conteúdo]: {content_preview}...\n")

        results_text.append(f"--- Fonte: {source} ---\n{doc.page_content}\n")

    return "\n\n".join(results_text)
