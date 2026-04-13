# Plano: correção dos problemas da auditoria do Reactify

## Contexto

Uma auditoria geral do projeto levantou 15 problemas priorizados (P0 = segurança/quebra, P1 = bug real, P2 = smell/dívida). Este plano cobre P0 + P1 + P2 e adiciona uma **Fase 2** com oportunidades de qualidade/refactor (Q1-Q10) identificadas numa passagem separada.

Antes de escrever, verifiquei cada item P0 lendo o código diretamente — dois deles que o auditor marcou como crítico **não são bugs hoje**. Este plano corrige só o que foi confirmado como real e endurece o resto como defense-in-depth.

Objetivos da Fase 1 (bugs/segurança):

1. Fechar o hole de autorização do `ToolController`, que hoje confia só em API key estática e permite ler qualquer `project_id`.
2. Alinhar o uso do pivot `UserProject` para evitar a armadilha "role é enum aqui, string ali".
3. Corrigir bugs reais de React (keys em listas, `console.log` esquecidos).
4. Remover smells de produção no py_service e Laravel.
5. Adicionar ESLint mínimo com `no-console` para prevenir reincidência.

## Itens confirmados vs. descartados da auditoria

**Confirmados (entram no plano):**

- P0-1: `ToolController` sem verificação de ownership.
- P1-4/5/6: `key={index}` em 4+ componentes React.
- P1-7: `search_knowledge_base` tool retornando dict Python em vez de string.
- P2-8..11: `console.log` em 4+ arquivos do front.
- P2-12: email no payload Inertia de [ProjectController.php:111](app/Http/Controllers/ProjectController.php#L111).
- P2-13: try/catch silencioso em [StoryController.php:52-71](app/Http/Controllers/StoryController.php#L52-L71).
- P2-14: `langchain.debug = True` hardcoded em [chat_service.py:26](py_service/chat_service.py#L26).
- P2-15: fallback `http://127.0.0.1:8001/...` errado em [chat_service.py:64](py_service/chat_service.py#L64) (porta do Laravel default é 8000, não 8001 — lá é o classup).

**Descartados (verificados e não são bugs):**

- P0-2 ([ProjectInvitationController.php:35](app/Http/Controllers/ProjectInvitationController.php#L35)): o auditor achou que a comparação `$currentProject->pivot->role !== 'administrator'` quebraria porque o pivot estaria cast para enum. **Na verdade não está**: [User::projects()](app/Models/User.php#L59) usa `belongsToMany` sem `->using(UserProject::class)`, então o pivot aqui é um `Pivot` genérico e `role` volta como string — a comparação funciona. Mas a inconsistência com [Project::users()](app/Models/Project.php#L82), que usa `->using(UserProject::class)`, é uma armadilha real: o mesmo `->pivot->role` é string num path e enum no outro. **Ação**: alinhar, não "consertar um bug".
- P0-3 ([ProjectPermissionController.php:62](app/Http/Controllers/ProjectPermissionController.php#L62)): o auditor disse que `->value` em `pivot->role` era inseguro. Mas o controller itera sobre `$project->users`, que **passa** pelo pivot `UserProject` (confirmado em [Project.php:82-89](app/Models/Project.php#L82-L89)), então o cast vale e `role` é enum. **Sem bug.**

---

# Fase 1: Bugs e segurança

## 1. P0 — Endurecer `ToolController` (defense-in-depth)

**Arquivos:**
- [app/Http/Controllers/ToolController.php](app/Http/Controllers/ToolController.php)
- [app/Http/Middleware/VerifyPythonServiceKey.php](app/Http/Middleware/VerifyPythonServiceKey.php)
- [py_service/chat_service.py](py_service/chat_service.py) (tool `get_data_from_artifact`)
- [app/Services/AIAssistantServiceGemini.php](app/Services/AIAssistantServiceGemini.php) (adicionar `user_id` ao payload enviado ao py_service)

**Mudanças:**

1. No [ChatController.php](app/Http/Controllers/ChatController.php) e/ou `AIAssistantServiceGemini`, o payload enviado ao py_service já inclui `user` — continuar incluindo, mas explicitar `user.id`.
2. No `chat_service.py`, a tool `get_data_from_artifact` passa a enviar ao Laravel `{project_id, artifact_name, user_id}` (user_id vem do prompt de sistema, que já tem o usuário no contexto).
3. Em `ToolController::getArtifactData`:
   - Validar também `user_id => 'required|integer|exists:users,id'`.
   - Trocar `Project::find($project_id)` por:
     ```php
     $project = Project::whereHas('users', fn($q) =>
         $q->where('users.id', $validated['user_id'])
     )->find($validated['project_id']);
     if (!$project) {
         return response()->json(['error' => 'Projeto não acessível a este usuário.'], 403);
     }
     ```
4. Manter `VerifyPythonServiceKey` como está — ele continua sendo a primeira barreira.

Resultado: mesmo que o LLM alucine/infete um `project_id` diferente por prompt injection, o Laravel recusa porque o `user_id` original não é membro.

## 2. P2 — Alinhar pivot `UserProject`

**Arquivo:** [app/Models/User.php:59-64](app/Models/User.php#L59-L64)

Trocar:
```php
return $this->belongsToMany(Project::class, 'user_project')
    ->withPivot('role')
    ->withTimestamps();
```
por:
```php
return $this->belongsToMany(Project::class, 'user_project')
    ->using(UserProject::class)
    ->withPivot('role')
    ->withTimestamps();
```

Efeito colateral: `$user->projects->first()->pivot->role` vira `UserRole` (enum), não string.

**Arquivos a atualizar por conta da mudança:**
- [ProjectInvitationController.php:35](app/Http/Controllers/ProjectInvitationController.php#L35): trocar `!== 'administrator'` por `!== UserRole::ADMINISTRATOR`. Adicionar `use App\Enums\UserRole;`.
- Grep por `->pivot->role` em controllers para encontrar outros callsites que comparam com string. Pelo menos verificar [ProjectController.php](app/Http/Controllers/ProjectController.php) e qualquer Middleware de permissão.

## 3. P1 — Chaves em listas React

**Arquivos confirmados:**
- [resources/js/Pages/projects/project-ceremonies/Modeling/OverallModel.jsx:112-118, 127-128](resources/js/Pages/projects/project-ceremonies/Modeling/OverallModel.jsx#L112-L128)
- [resources/js/Components/LeftMenu.jsx:16](resources/js/Components/LeftMenu.jsx#L16)
- [resources/js/Pages/Dashboard.jsx:165](resources/js/Pages/Dashboard.jsx#L165)

**Regra geral**: trocar `key={index}` por `key={item.id}` onde o item tem id estável. Se não tiver id (raro), criar um id de UI (`crypto.randomUUID()` no momento da criação, não durante render).

Após as correções, fazer um grep global `key=\{.*index\}` em [resources/js/](resources/js/) e corrigir qualquer sobrevivente.

## 4. P1 — Tool `search_knowledge_base` retornando dict

**Arquivo:** [py_service/chat_service.py:162-164](py_service/chat_service.py#L162-L164)

Trocar:
```python
return {"error": f"Artefato '{artifact_name}' inválido. Escolha entre: {', '.join(valid_artifacts)}"}
```
por:
```python
return f"Artefato '{artifact_name}' inválido. Escolha entre: {', '.join(valid_artifacts)}"
```
LangChain `@tool` espera string de retorno; dict vira `str(dict)` com repr Python — ruim para o LLM parsear.

## 5. P2 — Remover `console.log` esquecidos

**Arquivos confirmados:**
- [Storyboards.jsx](resources/js/Pages/projects/project-ceremonies/Modeling/Storyboards/Storyboards.jsx) (linhas 58, 94, 145, 224, 272)
- [OverallModel.jsx:574](resources/js/Pages/projects/project-ceremonies/Modeling/OverallModel.jsx#L574)
- [Register.jsx:27](resources/js/Pages/Auth/Register.jsx#L27)
- [Project.jsx:253, 263, 313](resources/js/Pages/projects/Project.jsx)

**Ação**: remover todos. Depois rodar `grep -rn "console\.\(log\|warn\|debug\)" resources/js/` e varrer qualquer sobrevivente (o plano assume ~10+ arquivos adicionais).

## 6. P2 — ESLint com `no-console`

O projeto **não tem ESLint configurado** (nenhum `eslint.config*`, nenhuma dep em `package.json`). Fazer o setup mínimo:

```bash
npm install --save-dev eslint @eslint/js eslint-plugin-react eslint-plugin-react-hooks
```

Criar [eslint.config.js](eslint.config.js) flat config enxuto:

```js
import js from '@eslint/js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  js.configs.recommended,
  {
    files: ['resources/js/**/*.{js,jsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    settings: { react: { version: 'detect' } },
    rules: {
      'no-console': ['warn', { allow: ['error'] }],
      'react/jsx-key': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]
```

Adicionar script em [package.json](package.json):
```json
"scripts": {
  "lint": "eslint resources/js"
}
```

Ficar em `warn` em vez de `error` na primeira leva para não quebrar o build. CI (quando existir) só avisa.

## 7. P2 — Email no payload Inertia

**Arquivo:** [app/Http/Controllers/ProjectController.php:111](app/Http/Controllers/ProjectController.php#L111)

Ler o contexto exato antes de decidir. Opção A: remover `email` do select dos colaboradores. Opção B: manter email mas só para admins do projeto. Default recomendado: **remover** — o frontend hoje não precisa do email dos colaboradores para renderizar cards; se precisar, usar avatar/nome/role.

## 8. P2 — try/catch silencioso em StoryController

**Arquivo:** [app/Http/Controllers/StoryController.php:52-71](app/Http/Controllers/StoryController.php#L52-L71)

Ação provável:
- Adicionar `$e->getMessage()` e `$request->all()` ao `Log::error`.
- Em `app()->environment('local')`, re-lançar a exceção para que o Laravel debug a pegue.
- Remover a mensagem genérica 500 e devolver o erro real pra UI (ou pelo menos um código mais útil que 500).

## 9. P2 — `langchain.debug` e fallback de URL no chat_service

**Arquivo:** [py_service/chat_service.py](py_service/chat_service.py)

- Linha 26: `langchain.debug = os.getenv("LANGCHAIN_DEBUG", "false").lower() == "true"`
- Linha 64: remover fallback hardcoded. Trocar por:
  ```python
  LARAVEL_TOOL_API_URL = os.getenv("LARAVEL_TOOL_API_URL")
  if not LARAVEL_TOOL_API_URL:
      raise RuntimeError("LARAVEL_TOOL_API_URL não configurado no .env")
  ```

## Verificação end-to-end (Fase 1)

1. **ToolController ownership**:
   - Fazer login com usuário A, abrir chat, perguntar sobre artefato. Confirmar sucesso nos logs.
   - Via `curl`, chamar `/api/tools/get-artifact-data` direto com a API key mas `user_id` que não pertence ao `project_id` — esperar 403.
2. **Pivot alinhado**: `php artisan tinker` → `User::find(1)->projects->first()->pivot->role` → deve retornar instância de `UserRole`. Validar também que [ProjectInvitationController.php](app/Http/Controllers/ProjectInvitationController.php) ainda aceita convites vindos de um admin (teste via UI).
3. **React keys**: rodar `npm run lint` — `react/jsx-key` não deve reclamar. Abrir páginas de OverallModel/Dashboard e reordenar/adicionar itens manualmente para confirmar que o estado dos filhos não vaza entre linhas.
4. **chat tool**: forçar via chat uma consulta a `artifact=xxx_invalido`. Olhar os logs do py_service e confirmar que o LLM recebeu a string (não `{'error': ...}`).
5. **console.log**: `grep -rn "console\.log" resources/js/` deve retornar ≤0 ocorrências (allowlist só `console.error`).
6. **langchain.debug**: reiniciar py_service sem `LANGCHAIN_DEBUG` setado — logs devem ficar enxutos.
7. **Email no Inertia**: abrir Network tab na página de Project, procurar o prop `collaborators` e confirmar que não tem campo `email`.
8. **StoryController**: forçar uma falha (ex: quebrar validação temporariamente) e confirmar que o log agora inclui o payload e a mensagem da exceção.

## Ordem de execução recomendada (Fase 1)

1. P0 (ToolController + wiring de `user_id`) → testar chat.
2. Pivot alignment → testar convite/permissões.
3. Limpeza de `console.log` + keys → lint setup.
4. Email no Inertia, StoryController, chat_service smells.
5. Rodar toda a verificação acima.

---

# Fase 2: Qualidade de código (refactor)

Itens identificados numa segunda passagem focada em manutenibilidade, não em bugs. **Não executar junto com os P0/P1** — fazer depois que os bugs estiverem resolvidos e mergeados, senão o diff vira intratável.

## Q1. Unificar os `*GeneratorControllerGemini` (maior alavanca)

**Sintoma:** ~10 controllers em [app/Http/Controllers/](app/Http/Controllers/) (Story, Journey, Persona, Goal, OverallModel, EpicStory, BusinessRule, UsageScenario, SystemInterface, ProductCanvas) — cada um com 300-450 linhas compartilhando ~70-80% da estrutura: validar `project_id`, buscar contexto, montar prompt, chamar Gemini, limpar ` ```json ` com regex, persistir. Exemplos gigantes: [StoryGeneratorControllerGemini.php](app/Http/Controllers/StoryGeneratorControllerGemini.php) (459 linhas), [JourneyGeneratorControllerGemini.php](app/Http/Controllers/JourneyGeneratorControllerGemini.php) (354 linhas).

**Refactor proposto:**

1. Criar `app/Services/AI/GeminiGeneratorService.php` com o fluxo único:
   - `generate(GeneratorStrategy $strategy, Project $project, array $input): array`
   - Faz: validação base, fetch de contexto via callback do strategy, chamada ao Gemini, parse JSON com `json_decode` (não regex), persist via strategy.
2. Criar `app/Services/AI/Strategies/GeneratorStrategy.php` (interface):
   - `buildContext(Project $project, array $input): array`
   - `buildPrompt(array $context): string`
   - `parseAndPersist(Project $project, array $rawItems): Collection`
3. Uma strategy por artefato: `StoryStrategy`, `JourneyStrategy`, etc. Cada uma ~60-80 linhas (só a parte específica).
4. Os controllers reduzem a ~20 linhas: recebem request, instanciam strategy, chamam service, devolvem JSON.
5. Validação: cada controller vira `FormRequest` específico (`GenerateStoriesRequest`, etc).

**Ganhos:**
- Remove ~2000 LOC duplicadas.
- Cada novo artefato = 1 strategy nova, não um controller copy-paste.
- Testável unitariamente (mockar `GeminiGeneratorService`).
- Cobertura de testes fica viável — hoje não é.

**Ordem interna do refactor:**
1. Escolher o menor controller como piloto ([ProductCanvasGeneratorControllerGemini.php](app/Http/Controllers/ProductCanvasGeneratorControllerGemini.php) provavelmente) e migrar sozinho.
2. Validar fluxo end-to-end.
3. Migrar os outros 9 em PRs separados (ou um só, dependendo da tolerância a reviews grandes).

**Helpers duplicados que caem junto:** `hasContentfulPersonas`, `hasContentfulJourneys`, `hasContentfulConstraintGoals` etc (ex: [StoryGeneratorControllerGemini.php:110-155](app/Http/Controllers/StoryGeneratorControllerGemini.php#L110-L155)) → viram método único em `GeminiGeneratorService` ou trait `HasContentfulChecks`.

## Q2. Quebrar componentes React monolíticos (>1000 linhas)

**Alvos confirmados:**
- [OverallModel.jsx](resources/js/Pages/projects/project-ceremonies/Modeling/OverallModel.jsx) — 1132 linhas
- [Journeys.jsx](resources/js/Pages/projects/project-ceremonies/Inception/Journeys.jsx) — 1013 linhas
- [ProductBacklog.jsx](resources/js/Pages/projects/project-ceremonies/ProductBacklog.jsx) — 997 linhas

Cada um mistura: modal de geração por IA, tabela principal, formulário de edição, 15+ `useState`.

**Refactor proposto (padrão a replicar):**
1. Extrair por responsabilidade:
   - `<CeremonyTable />` — render da tabela principal
   - `<CeremonyAIModal />` — modal de "gerar via IA e aceitar sugestões"
   - `<CeremonyEditor />` — form de edição inline ou drawer
2. Handlers para `useCallback` (evita re-render dos filhos).
3. Criar hook compartilhado `useCeremonyAI(endpoint, projectId)` que encapsula o fluxo comum: "disparar geração → receber lista → permitir selecionar → confirmar → persistir". Esse fluxo é basicamente idêntico entre Personas/Journeys/Goals/Stories — hoje está duplicado em cada componente.

**Ordem interna:** começar pelo Journeys (provável mais simples), usar como modelo para OverallModel/ProductBacklog.

## Q3. Quebrar `py_service/chat_service.py` (543 linhas)

Combina com o plano de migração Ollama em [MIGRATION_PLAN_OLLAMA.md](MIGRATION_PLAN_OLLAMA.md) — fazer os dois no mesmo PR.

**Estrutura proposta:**
```
py_service/
  app.py              # só Flask routes (chat-stream, health)
  agent.py            # build_agent(), invoke_agent()
  tools.py            # @tool search_knowledge_base, get_data_from_artifact, get_data_from_interview
  prompts.py          # build_system_prompt()
  rag.py              # vector store setup, retriever
  llm_factory.py      # já proposto no plano Ollama
  config.py           # ver item Q8
```

**Ganhos:**
- Testar `tools.py` e `prompts.py` sem subir Flask.
- Troca de provider (plano Ollama) fica isolada em `llm_factory.py` e `rag.py`.

## Q4. Adotar Zustand nas cerimônias

**Sintoma:** [Journeys.jsx:14-21](resources/js/Pages/projects/project-ceremonies/Inception/Journeys.jsx#L14-L21) passa 15+ props para filhos. `zustand` já está no `package.json` mas é pouco usado.

**Ação:** criar stores por cerimônia (`useJourneyStore`, `useStoryStore`, etc) para estado de UI (modal aberto, itens selecionados, edição corrente). Server state continua via Inertia/props. Reduz prop drilling e simplifica o Q2.

Fazer **depois** do Q2 — a quebra dos componentes já elimina parte do problema, e o Zustand se encaixa melhor numa árvore menor.

## Q5. Padronizar validação: FormRequest para endpoints não-triviais

**Sintoma:** [app/Http/Requests/](app/Http/Requests/) tem 42 classes, mas muitos controllers ainda usam `$request->validate(...)` inline. Sem padrão.

**Regra a adotar:** qualquer endpoint com ≥3 campos ou regra condicional usa FormRequest. Inline só para `show`/`destroy` com 1 param.

**Execução:** fazer em ondas, começando pelos generators (que ganham FormRequest natural no refactor Q1). Depois varrer o resto com `grep -rn "->validate(\[" app/Http/Controllers/`.

## Q6. Padronizar `snake_case` → `camelCase` nas relações do Model Project

**ADIADO** — escopo muito maior do que parecia à primeira vista. Ao tentar executar, ficou claro que:

- Eloquent usa o nome do método de relação como chave do atributo no JSON serializado. Renomear `goal_sketches()` → `goalSketches()` muda o payload que chega ao frontend.
- O frontend referencia dezenas de vezes `project.goal_sketches`, `project.product_canvas`, `project.crc_cards`, `project.overall_model_classes`, `project.business_rules`, etc.
- O `py_service` usa esses nomes como strings de artefato em `valid_artifacts` e no mapeamento do `build_system_prompt`.
- O `ToolController` abre um `switch` em cima dessas strings.

Fazer o rename sem quebrar exige manter accessors shim no Model (duplicando cada chave) ou migrar frontend + Laravel + py_service juntos — trabalho de dias, não de horas. Fica para um PR dedicado depois que o refactor dos componentes React (Q2) já tiver reduzido a superfície de referências.

**Sintoma original:** [Project.php](app/Models/Project.php) mistura `goal_sketches()`, `overall_model_classes()`, `product_canvas()` com `journeys()`, `personas()`, `stories()` — quebra convenção Laravel mas não há solução barata.

## Q7. Auditar `$fillable` em todos os Models

**Ação:** para cada arquivo em [app/Models/](app/Models/), garantir `protected $fillable` explícito. Nada de `$guarded = []` implícito. Menos de 2h de trabalho.

## Q8. Centralizar config do `py_service`

**Sintoma:** `os.getenv(...)` espalhado por [chat_service.py:20-26, 64-66](py_service/chat_service.py) com fallbacks ad-hoc.

**Ação:** criar `py_service/config.py` com classe `Config` que carrega tudo na startup e falha rápido se faltar variável obrigatória. Padrão semelhante ao do classup.

```python
# py_service/config.py
import os
from dotenv import load_dotenv
load_dotenv()

class Config:
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
    LLM_MODEL = os.getenv("LLM_MODEL", "qwen3:14b")
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://192.168.0.101:11434")
    DATABASE_URL = os.getenv("DATABASE_URL")
    LARAVEL_TOOL_API_URL = os.getenv("LARAVEL_TOOL_API_URL")
    PYTHON_SERVICE_API_KEY = os.getenv("PYTHON_SERVICE_API_KEY", "")
    LANGCHAIN_DEBUG = os.getenv("LANGCHAIN_DEBUG", "false").lower() == "true"
    PGVECTOR_COLLECTION = os.getenv("PGVECTOR_COLLECTION", "react_nomic_768")

    @classmethod
    def validate(cls):
        required = ["DATABASE_URL", "LARAVEL_TOOL_API_URL", "PYTHON_SERVICE_API_KEY"]
        missing = [k for k in required if not getattr(cls, k)]
        if missing:
            raise RuntimeError(f"Config obrigatória ausente: {missing}")

Config.validate()
```

## Q9. Remover `auto-imports.d.ts` do git

**Sintoma:** [auto-imports.d.ts](auto-imports.d.ts) tem 800+ linhas auto-geradas pelo `unplugin-auto-import`, versionadas. Polui diffs e dá merge conflicts sem valor.

**Ação:** adicionar ao `.gitignore`, remover do tracking (`git rm --cached auto-imports.d.ts`). O plugin gera sob demanda no dev/build.

## Q10. Cobertura de testes pós-refactor

**Não executar antes dos Q1-Q3.** Os controllers e componentes atuais são difíceis de testar (muito acoplamento, estado global, chamadas externas sem fachada). Depois do refactor:

1. **Unit tests** para `GeneratorStrategy` (mock do `GeminiGeneratorService`).
2. **Feature tests** para `ToolController` cobrindo o cenário de autorização cruzada (projeto X, usuário Y → 403).
3. **Python**: `pytest` cobrindo `tools.py` e `prompts.py` sem subir Flask.

Meta realista: cobrir os fluxos críticos, não buscar % de cobertura.

## Priorização (Fase 2)

| # | Item | Impacto | Esforço | Quando |
|---|---|---|---|---|
| Q1 | Unificar Gemini controllers | 🔴 alto | 2-3d | Primeiro — maior ROI |
| Q3 | Quebrar `chat_service.py` | 🔴 alto | 2d | Junto com migração Ollama |
| Q2 | Quebrar componentes React | 🟠 alto | 2-3d | Depois de Q1 |
| Q4 | Zustand nas cerimônias | 🟠 médio | 1-2d | Depois de Q2 |
| Q5 | FormRequest padronizado | 🟠 médio | 1d (ondas) | Em paralelo com Q1 |
| Q6 | camelCase nas relações | 🟡 médio | 4h | Isolado |
| Q8 | `config.py` no py_service | 🟡 baixo | 4h | Junto com Q3 |
| Q7 | `$fillable` audit | 🟡 baixo | 2h | Isolado |
| Q9 | Tirar `auto-imports.d.ts` | 🟡 baixo | 15min | Isolado |
| Q10 | Testes pós-refactor | 🟠 alto | contínuo | Depois de Q1-Q3 |

**Regra:** não misturar Q1 ou Q2 com bugs/segurança no mesmo PR. Refactor grande + fix = review infernal.
