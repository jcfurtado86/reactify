# Reactify

Plataforma Laravel + Inertia/React com serviços Python auxiliares (chat RAG e entrevistas por voz).

## Stack

- **Backend web**: Laravel 12 (PHP 8.2+), Inertia, Vite
- **Frontend**: React + Tailwind
- **Banco**: PostgreSQL com extensão `pgvector`
- **Serviços Python** (`py_service/`): `chat_service.py` (agente RAG) e `interview_service.py` (transcrição de entrevistas)

## Pré-requisitos

- PHP 8.2+, Composer, Node 20+
- Python 3.11+
- PostgreSQL com `pgvector` habilitado (`CREATE EXTENSION vector;`)
- Acesso a um servidor Ollama OU chaves de API para Gemini/Anthropic

## Setup do ambiente de desenvolvimento

### 1. Laravel

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
```

Preencha no `.env` as credenciais de banco (`DB_*`) e, se for usar Gemini pelo Laravel, `GEMINI_API_KEY`.

### 2. Ambiente Python (raiz do projeto)

```bash
python -m venv .venv
```

Ativar o venv:

```bash
# bash/zsh
source .venv/bin/activate

# fish
. .venv/bin/activate.fish
```

Instalar dependências:

```bash
cd py_service
pip install -r requirements.txt
```

Baixar o modelo de embeddings local usado pelo RAG:

```bash
python hf.py
```

### 3. Variáveis de ambiente do py_service

No mesmo `.env` da raiz, adicione:

```env
DATABASE_URL=postgresql+psycopg2://usuario:senha@host:porta/nome_do_banco
LLM_PROVIDER=ollama
```

Detalhes de cada provider estão na próxima seção.

### 4. Ingestão da base de conhecimento (RAG)

Com o venv ativo e o `pgvector` disponível:

```bash
cd py_service
python ingest_transcription.py
```

## Configuração de LLM

O arquivo [py_service/llm_factory.py](py_service/llm_factory.py) centraliza a escolha do modelo. Trocar de provider é questão de env var, sem mexer no código. O valor de `LLM_PROVIDER` aceita `gemini`, `claude` ou `ollama`.

### Ollama (local ou self-hosted)

```env
LLM_PROVIDER=ollama
LLM_OLLAMA_MODEL=qwen3:8b
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

Ajuste `OLLAMA_BASE_URL` para o host onde seu Ollama está rodando. Verifique que o modelo está disponível:

```bash
curl $OLLAMA_BASE_URL/api/tags
```

Se faltar, puxe no host do Ollama:

```bash
ollama pull qwen3:8b
```

### Gemini (Google)

```env
LLM_PROVIDER=gemini
LLM_GEMINI_MODEL=gemini-2.5-flash
GOOGLE_API_KEY=sua_chave
```

### Claude (Anthropic)

```env
LLM_PROVIDER=claude
LLM_CLAUDE_MODEL=claude-haiku-4-5-20251001
ANTHROPIC_API_KEY=sua_chave
```

### Whisper (entrevistas)

O `interview_service.py` usa OpenAI Whisper para transcrição e é independente da escolha acima. Configure:

```env
OPENAI_API_KEY=sua_chave
```

## Rodando o projeto

Com o venv Python ativo, a forma mais simples é rodar tudo pelo composer (sobe Laravel, filas, Vite e logs juntos):

```bash
composer dev
```

### Rodando serviços separadamente

Abra um terminal por serviço, sempre com o venv ativo.

Chat RAG:

```bash
./run_chatbot_service.sh
```

Entrevista por voz:

```bash
./run_interview_service.sh
```

Backend Laravel + Vite:

```bash
./run_backend.sh
```
