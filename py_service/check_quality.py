import os
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_postgres import PGVector

load_dotenv()

# Configuração (Mesma do app)
HF_MODEL_PATH = ".hf_models" 
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

def test_retrieval(query):
    print(f"\n❓ Pergunta: '{query}'")
    # Busca com pontuação (similarity_search_with_score)
    # No PGVector, dependendo da métrica (cosine/l2), o score pode variar.
    # Geralmente Cosine Distance: quanto menor, melhor (mais próximo de 0).
    results = vector_store.similarity_search_with_score(query, k=3)
    
    for doc, score in results:
        print(f"   Score: {score:.4f} | Fonte: {doc.metadata.get('source')}")
        print(f"   Texto: {doc.page_content[:150]}...")
        print("-" * 70)

if __name__ == "__main__":
    # Teste com termos que VOCÊ sabe que estão nos arquivos
    test_retrieval("O que é uma Persona?")
    test_retrieval("Quais são as cerimônias do REACT-M?")