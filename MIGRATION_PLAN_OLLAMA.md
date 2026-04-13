# Migração do chat IA do Reactify: Gemini + OpenAI → Ollama local

## Contexto

O `py_service` do Reactify hoje depende de duas APIs externas:

- **LLM**: Google Gemini (`gemini-2.5-flash`) via `langchain_google_genai.ChatGoogleGenerativeAI`
- **Embeddings**: OpenAI (`text-embedding-3-small`) via `langchain_openai.OpenAIEmbeddings`

O usuário quer rodar o Reactify no Beelink (`192.168.0.101`), que já hospeda um servidor Ollama com o modelo **Qwen3-14B** instalado. O projeto classup já usa esse mesmo servidor. Esta migração:

- Elimina custos e latência de APIs externas no caminho crítico do chat.
- Elimina envio de dados do projeto para Google/OpenAI (privacidade).
- Mantém infra compartilhada com o classup.
- Mantém o **Whisper** da OpenAI em [py_service/interview_service.py](py_service/interview_service.py) intocado — fora do escopo.

## Decisões (confirmadas com o usuário)

| Item | Escolha |
|---|---|
| Host Ollama | `http://192.168.0.101:11434` |
| Modelo LLM | `qwen3:14b` com `think=false` (thinking desabilitado) |
| Embeddings | `nomic-embed-text` via Ollama (exige reingestão do pgvector) |
| Whisper | Manter OpenAI (fora de escopo) |
| Base de conhecimento | Reconstruída a partir de [py_service/react_m/](py_service/react_m/) |

## Estratégia de desacoplamento (provider-agnóstico)

O objetivo é que **voltar para uma API online (Gemini, OpenAI, Anthropic…) seja uma mudança de `.env`, não de código**. Para isso:

### Factory com `init_chat_model` (LangChain)

LangChain já expõe `langchain.chat_models.init_chat_model(model, model_provider=..., **kwargs)`, que devolve um `BaseChatModel` de qualquer provider suportado (`ollama`, `google_genai`, `openai`, `anthropic`, `groq`, etc). Idem para embeddings via `langchain.embeddings.init_embeddings("<provider>:<model>")`.

Criar um módulo novo **[py_service/llm_factory.py](py_service/llm_factory.py)** (arquivo novo, ~30 linhas) com duas funções:

```python
# py_service/llm_factory.py
import os
from langchain.chat_models import init_chat_model
from langchain.embeddings import init_embeddings

def build_llm():
    provider = os.getenv("LLM_PROVIDER", "ollama")          # ollama | google_genai | openai | anthropic
    model    = os.getenv("LLM_MODEL",    "qwen3:14b")
    kwargs = {
        "temperature": float(os.getenv("LLM_TEMPERATURE", "0.7")),
    }
    if provider == "ollama":
        kwargs["base_url"] = os.getenv("OLLAMA_BASE_URL", "http://192.168.0.101:11434")
        kwargs["reasoning"] = False   # desliga <think> do Qwen3
    return init_chat_model(model, model_provider=provider, **kwargs)

def build_embeddings():
    # init_embeddings aceita "provider:model"
    spec = os.getenv("EMBEDDINGS_SPEC", "ollama:nomic-embed-text")
    kwargs = {}
    if spec.startswith("ollama:"):
        kwargs["base_url"] = os.getenv("OLLAMA_BASE_URL", "http://192.168.0.101:11434")
    return init_embeddings(spec, **kwargs)
```

`chat_service.py` e os scripts de ingestão passam a importar apenas essas duas funções — zero conhecimento de provider específico. Trocar para Gemini no futuro vira:

```env
LLM_PROVIDER=google_genai
LLM_MODEL=gemini-2.5-flash
GOOGLE_API_KEY=...
EMBEDDINGS_SPEC=openai:text-embedding-3-small
OPENAI_API_KEY=...
```

Sem tocar em código Python.

**Atenção à dimensão do embedding**: provider diferente = dimensão diferente = nova coleção no pgvector. Solução: adicionar env var `PGVECTOR_COLLECTION` (default `react_nomic_768`) e usar em `chat_service.py` e no script de ingestão. Ao trocar de embedding, muda-se também `PGVECTOR_COLLECTION`, evitando conflito com vetores antigos e permitindo manter ambas as coleções lado a lado durante migrações.

### Tradeoff aceito

Isso acrescenta **um arquivo novo** e **duas funções indiretas**, mas: (a) evita hardcode de qualquer provider no código, (b) a cada troca de provider basta rodar os scripts de ingestão apontando para a nova coleção, (c) é o mesmo espírito do classup (lá é explícito com classes; aqui `init_chat_model` já entrega a mesma abstração sem código adicional).

## Arquivos a modificar

### 1. [py_service/requirements.txt](py_service/requirements.txt)

- **Manter**: `langchain-google-genai`, `langchain-openai`, `openai` — mesmo usando Ollama. Esses pacotes são dependências *opcionais* que o `init_chat_model` / `init_embeddings` carregam dinamicamente conforme o `LLM_PROVIDER`. Tê-los instalados permite voltar para Gemini/OpenAI só mudando o `.env`, sem `pip install` adicional. Custo: poucos MB a mais no venv.
- **Adicionar**: `langchain-ollama`, `docling`, `yt-dlp` (os dois últimos para o novo pipeline de ingestão de `react_m/`).
- Se o usuário preferir footprint mínimo, remover os provedores não-usados e reinstalar quando voltar online.

### 2. Novo arquivo [py_service/llm_factory.py](py_service/llm_factory.py)

Criar com o conteúdo mostrado na seção anterior.

### 3. [py_service/chat_service.py](py_service/chat_service.py)

- **Linhas 7–8**: remover imports `langchain_google_genai` e `langchain_openai`. Adicionar `from llm_factory import build_llm, build_embeddings`.
- **Linhas 20–25**: remover bloco `GOOGLE_API_KEY`/`GEMINI_API_KEY` e a instanciação de `ChatGoogleGenerativeAI`. Trocar por `llm = build_llm()`.
- **Linha 45**: trocar por `embeddings = build_embeddings()`.
- **Linha 49**: trocar `collection_name = "react"` por `collection_name = os.getenv("PGVECTOR_COLLECTION", "react_nomic_768")`.
- **Agent** ([chat_service.py:482-486](py_service/chat_service.py#L482-L486)): **sem alteração**. `create_agent(model=llm, tools=..., system_prompt=...)` é provider-agnóstico e o Qwen3-14B tem suporte nativo a tool calling — os três `@tool` (`search_knowledge_base`, `get_data_from_artifact`, `get_data_from_interview`) continuam funcionando.
- **`build_system_prompt`** ([chat_service.py:286-402](py_service/chat_service.py#L286-L402)): reescrever conforme a seção "Revisão do system prompt" abaixo.

### 4. [py_service/ingest_transcription.py](py_service/ingest_transcription.py)

**Aposentar** (mover para `py_service/_archive/`). Ele lê de uma pasta `transcriptions/` solta, o que contraria o requisito de alimentar o RAG exclusivamente a partir de `react_m/`. Toda ingestão passa a ser feita pelo novo `ingest_react_m.py`.

### 5. `.env` (não versionado) — documentar no handover

Adicionar (valores para o setup atual com Ollama):

```
LLM_PROVIDER=ollama
LLM_MODEL=qwen3:14b
LLM_TEMPERATURE=0.7
OLLAMA_BASE_URL=http://192.168.0.101:11434
EMBEDDINGS_SPEC=ollama:nomic-embed-text
PGVECTOR_COLLECTION=react_nomic_768
```

`OPENAI_API_KEY` permanece (Whisper em `interview_service.py` e transcrição dos vídeos do YouTube). `GEMINI_API_KEY`/`GOOGLE_API_KEY` podem ficar comentados — úteis para rollback rápido.

## Base de conhecimento: reconstrução a partir de [py_service/react_m/](py_service/react_m/)

**Requisito do usuário**: o RAG deve ser alimentado **exclusivamente** pelo conteúdo da pasta `react_m/`. Hoje essa pasta contém:

- [Dissertacao_Bleno_VersaoFinal.pdf](py_service/react_m/Dissertacao_Bleno_VersaoFinal.pdf) — 9 MB, texto teórico da metodologia REACT-M.
- [extract_docs.py](py_service/react_m/extract_docs.py) — stub de 7 linhas que usa `docling.DocumentConverter` para converter o PDF em Markdown. **Só imprime**, não indexa.
- [links.txt](py_service/react_m/links.txt) — 8 URLs do YouTube com aulas/explicações da metodologia.

Ou seja, **o pipeline de ingestão não existe completo ainda**. Precisa ser construído.

### Dimensão da nova coleção

A dimensão muda: `text-embedding-3-small` = **1536** → `nomic-embed-text` = **768**. Usar um nome de coleção novo (`react_nomic_768`) é preferível a dropar a antiga — preserva os vetores atuais caso seja preciso rolar de volta para OpenAI.

### Novo script: [py_service/react_m/ingest_react_m.py](py_service/react_m/ingest_react_m.py)

Criar um script único que faz o end-to-end da pasta:

```python
# py_service/react_m/ingest_react_m.py (pseudo-estrutura)
import os, glob, sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))  # para importar llm_factory
from llm_factory import build_embeddings
from docling.document_converter import DocumentConverter
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_postgres import PGVector

REACT_M_DIR = os.path.dirname(__file__)
COLLECTION  = os.getenv("PGVECTOR_COLLECTION", "react_nomic_768")

def load_pdfs():
    converter = DocumentConverter()
    for pdf in glob.glob(os.path.join(REACT_M_DIR, "*.pdf")):
        md = converter.convert(pdf).document.export_to_markdown()
        yield Document(page_content=md, metadata={"source": os.path.basename(pdf), "type": "pdf"})

def load_youtube_links():
    # Lê links.txt, usa yt-dlp para baixar o áudio e OpenAI Whisper
    # (já disponível via `openai` no requirements) para transcrever.
    # Cacheia transcrições em react_m/_cache/<video_id>.txt para não repetir.
    ...

def main():
    docs = list(load_pdfs()) + list(load_youtube_links())
    splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=150)
    chunks = splitter.split_documents(docs)
    store = PGVector(
        embeddings=build_embeddings(),
        collection_name=COLLECTION,
        connection=os.getenv("DATABASE_URL"),
        use_jsonb=True,
    )
    store.add_documents(chunks)
    print(f"{len(chunks)} chunks ingeridos em '{COLLECTION}'.")

if __name__ == "__main__":
    main()
```

**Decisões embutidas**:

- **PDF**: usa `docling` (já adotado pelo usuário em `extract_docs.py`) em vez de `pdfplumber`, porque docling preserva estrutura/tabelas em Markdown — melhor para RAG.
- **YouTube**: `yt-dlp` (baixa só o áudio .m4a) + OpenAI Whisper (já no requirements via `openai`, coerente com [interview_service.py](py_service/interview_service.py) que mantemos). Cachear a transcrição em `react_m/_cache/` para que re-rodar a ingestão não pague o Whisper de novo.
- **Chunking**: `RecursiveCharacterTextSplitter` com 1200/150 — padrão sugerido no LangChain para textos acadêmicos em português.
- **Metadata**: `{source, type}` para o `search_knowledge_base` poder distinguir "dissertação" de "aula transcrita".

### Passos operacionais

1. `ollama pull nomic-embed-text` no Beelink.
2. `PGVECTOR_COLLECTION=react_nomic_768` no `.env`.
3. `pip install langchain-ollama docling yt-dlp` (ou atualizar `requirements.txt` e `pip install -r`).
4. `python py_service/react_m/ingest_react_m.py` — primeiro run baixa áudios, transcreve e indexa. Runs seguintes reusam cache.
5. Conferir no psql:
   ```sql
   SELECT name, COUNT(*) FROM langchain_pg_collection c
   JOIN langchain_pg_embedding e ON e.collection_id = c.uuid
   WHERE c.name = 'react_nomic_768' GROUP BY name;
   ```
   deve retornar uma contagem não-trivial.
6. (Opcional) Depois de validado, limpar a coleção `react` antiga do pgvector para liberar espaço.

## Revisão do system prompt do Facilitador

O prompt atual vive em [chat_service.py:286-402 `build_system_prompt`](py_service/chat_service.py#L286-L402). Ele estabelece bem o papel ("Facilitador REACT-M, coach e guia"), mas tem **bugs e instruções contraditórias** que prejudicam a eficácia — não são culpa do provider, mas vão ficar mais visíveis com Qwen3-14B (modelos abertos são mais literais que Gemini e seguem más instruções cegamente). Corrigir **junto com a migração**.

### Problemas encontrados

1. **Referência morta ao JSON embutido** ([L387](py_service/chat_service.py#L387)): a instrução 4 diz *"Se o usuário perguntar sobre os dados, use o JSON fornecido (abaixo)"*, mas o docstring em [L287-289](py_service/chat_service.py#L287-L289) explica que esse JSON foi **removido** do prompt. O modelo vai procurar dados que não existem e pode inventar. **Remover** a menção ou trocar por "chame `get_data_from_artifact` com o artefato atual".
2. **"SEMPRE USE" duplo e absoluto** ([L377-378](py_service/chat_service.py#L377-L378)): obriga `search_knowledge_base` E `get_data_from_interview` em **toda** interação — inclusive em saudações como "oi". Gasta tokens, atrasa resposta e polui o contexto. Trocar por regras condicionais:
   - Saudação / small talk → **não** chamar tool nenhuma.
   - Pergunta sobre metodologia REACT-M / papel do facilitador / teoria → `search_knowledge_base`.
   - Pergunta sobre "meu projeto", "minhas personas", "minhas stories", ou qualquer coisa específica da tela atual → `get_data_from_artifact` passando o artefato atual.
   - Pergunta sobre requisitos levantados em entrevistas → `get_data_from_interview`.
3. **Numeração quebrada** ([L349-350](py_service/chat_service.py#L349-L350)): dois itens marcados como "2." na lista de ferramentas. Corrigir para 1/2/3.
4. **Instruções incompletas com "..."** ([L384-389](py_service/chat_service.py#L384-L389)): o prompt tem frases truncadas com reticências ("Seja um Guia, Não um Dicionário: ..."). O modelo preenche o vazio com achismo. Completar cada instrução com orientação concreta, ex: *"Seja um Guia, Não um Dicionário: nunca recite definições da metodologia sem primeiro relacioná-las ao estado atual do artefato do usuário. Abra respostas com um mini-diagnóstico ('Vi que seu Canvas tem 2 problemas e 0 soluções — vamos trabalhar as soluções') antes de entrar em teoria."*
5. **Falta guardrail anti-alucinação**: adicionar *"Se uma tool retornar vazio ou erro, diga explicitamente que não encontrou o dado e pergunte ao usuário em vez de inventar. Nunca invente nomes de personas, stories ou objetivos."*
6. **Idioma não fixado**: Gemini infere pelo contexto, Qwen3 às vezes responde em inglês. Adicionar *"Responda sempre em português do Brasil, independentemente do idioma da pergunta."*
7. **Mapa de tradução no meio das regras**: a lista snake_case → nome natural ocupa 18 linhas no meio das REGRAS CRÍTICAS ([L355-370](py_service/chat_service.py#L355-L370)), dificultando o foco. Mover para o fim do prompt como glossário.
8. **Proatividade pouco operacional**: "Seja Proativo: Faça perguntas que guiem o usuário..." é vago. Trocar por uma heurística: *"Ao final de cada resposta, proponha **uma** próxima ação concreta alinhada à cerimônia atual ('{page_name}'). Uma só — não despeje lista de sugestões."*
9. **Contexto da cerimônia subutilizado**: hoje o prompt só insere `{page_name}` e `{artifact_name}` como rótulos. Adicionar uma linha que amarra comportamento: *"Sua prioridade neste turno é ajudar o usuário a progredir em '{artifact_name}' dentro da cerimônia '{page_name}'. Se a pergunta dele estiver fora disso, responda, mas volte ao contexto."*

### Mudança proposta (estrutura reescrita)

Reescrever `build_system_prompt` mantendo a mesma assinatura e variáveis, mas reorganizando em blocos claros — Qwen3 segue melhor prompts com seções nomeadas:

```
# PAPEL
Você é o Facilitador REACT-M ... (1 parágrafo)

# IDIOMA
Responda sempre em português do Brasil.

# CONTEXTO ATUAL
- Usuário: {user_name} ({user_role})
- Projeto: {project_title} — {project_desc}
- Cerimônia: {page_name}
- Artefato em foco: {artifact_name}

# FERRAMENTAS E QUANDO USAR
- get_data_from_artifact(artifact): use quando a pergunta for sobre dados do projeto do usuário. Passe "{artifact_name}" por padrão.
- search_knowledge_base(query): use quando a pergunta for sobre teoria/metodologia REACT-M ou sobre seu papel como Facilitador.
- get_data_from_interview(): use quando a pergunta envolver requisitos, dores ou entrevistas com stakeholders.
- Saudações e small talk: NÃO use ferramentas.

# REGRAS
1. Nunca invente dados. Se uma tool voltar vazia, diga e pergunte ao usuário.
2. Nunca exponha snake_case, IDs, chaves JSON ou o project_id.
3. Traduza nomes técnicos usando o glossário abaixo.
4. Nunca mostre JSON cru.

# ESTILO DE FACILITADOR
1. Abra com um mini-diagnóstico do estado atual do artefato antes de entrar em teoria.
2. Sua prioridade é fazer o usuário progredir em "{artifact_name}" dentro de "{page_name}".
3. Termine com UMA próxima ação concreta (não uma lista).
4. Formatação: use listas Markdown curtas com até 2 níveis.

# GLOSSÁRIO (snake_case → nome natural)
product_canvas → Canvas do Produto
goal_sketches → Objetivos do Produto
...
```

Manter o `match`/`case` de mapeamento de `artifact_name` como está — ele resolve o alias de frontend (`productCanvas` → `product_canvas`) antes de entrar no prompt.

### Teste rápido de regressão do prompt

Antes de considerar a migração pronta, rodar estas 4 perguntas manuais no chat:

1. **"oi"** → deve responder cordial, **sem** chamar tools (verificar logs).
2. **"quais objetivos eu já registrei nesse projeto?"** (estando na página `goals`) → deve chamar `get_data_from_artifact("goal_sketches")` e responder com nomes reais.
3. **"o que é uma persona no REACT-M?"** → deve chamar `search_knowledge_base`.
4. **"me fale sobre o projeto XYZ que não existe"** → deve admitir que não encontrou e perguntar, sem inventar.

Se algum desses falhar, ajustar a seção correspondente do prompt antes de dar a migração como concluída.

## Dependências a instalar

No venv do py_service:

```bash
source .venv/bin/activate
pip install langchain-ollama docling yt-dlp
# opcional, se for remover os provedores online:
# pip uninstall langchain-google-genai langchain-openai
```

Atualizar [requirements.txt](py_service/requirements.txt) para refletir o estado final.

## Verificação end-to-end

1. **Conectividade**: `curl http://192.168.0.101:11434/api/tags` do host que roda o py_service — deve listar `qwen3:14b` e `nomic-embed-text`.
2. **Boot do serviço**: `./run_chatbot_service.sh` não deve reclamar de chaves Google ausentes; deve imprimir os logs de "Inicializando RAG" sem erro.
3. **Embeddings**: depois de reingerir, rodar uma query manual à tool `search_knowledge_base` via endpoint Flask (ou teste mínimo inline) e conferir que retorna chunks coerentes do PDF/transcrições.
4. **Tool calling**: abrir o chat no frontend, estar em uma página de artefato (ex: `stories`) e perguntar "quais são as stories atuais deste projeto?" — o agent deve invocar `get_data_from_artifact` (ver logs do Flask) e responder com dados reais do projeto.
5. **Latência**: primeira resposta do Qwen3-14B no Beelink pode demorar alguns segundos; aceitável. Se for inviável, avaliar um modelo menor (`qwen2.5:7b`).
6. **Regressão**: confirmar que [interview_service.py](py_service/interview_service.py) continua transcrevendo áudio pela OpenAI (sem alteração esperada).

## Fora de escopo

- Migração do Whisper para local.
- Alterações no frontend React ou no `ChatController.php` — o contrato HTTP entre Laravel e py_service não muda.
