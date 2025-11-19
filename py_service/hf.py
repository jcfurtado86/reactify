# from transformers import AutoModel, AutoTokenizer

# # Load the model and tokenizer from Hugging Face
# model_name = "BAAI/bge-m3"  # You can replace this with any model name
# # Change: Use AutoModel instead of AutoModelForSequenceClassification
# model = AutoModel.from_pretrained(model_name)
# tokenizer = AutoTokenizer.from_pretrained(model_name)

# hf_models = ".hf_models"
# model.save_pretrained(hf_models)
# tokenizer.save_pretrained(hf_models)


# or hf download HuggingFaceH4/zephyr-7b-beta
# or 
# from huggingface_hub import hf_hub_download
# import joblib

# REPO_ID = "YOUR_REPO_ID"
# FILENAME = "sklearn_model.joblib"

# model = joblib.load(
#     hf_hub_download(repo_id=REPO_ID, filename=FILENAME)
# )

# hf.py (Atualizado para formato Sentence Transformers)
import os
from sentence_transformers import SentenceTransformer

# Nome do modelo
model_name = "BAAI/bge-m3"
save_path = ".hf_models" # ou "./.hf_models" se rodar na raiz

print(f"🔄 Baixando/Carregando modelo {model_name} via SentenceTransformer...")

# Ao usar a classe SentenceTransformer, ela já baixa a configuração correta de Pooling (CLS vs Mean)
model = SentenceTransformer(model_name)

# Salva no formato que o LangChain espera (com modules.json, config_sentence_transformers.json, etc)
print(f"💾 Salvando modelo em: {save_path}")
model.save(save_path)

print("✅ Modelo salvo corretamente no formato Sentence-Transformers!")