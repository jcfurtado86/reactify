"""
Testes unitários do builder de prompt e do resolver de aliases de artefato.
Não sobem Flask nem LangChain — só exercitam a função pura.

Rodar com:
    cd py_service && python -m pytest tests/ -q
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup mínimo de env pra não falhar na validação do Config.
os.environ.setdefault("DATABASE_URL", "postgresql://stub")
os.environ.setdefault("LARAVEL_TOOL_API_URL", "http://stub")
os.environ.setdefault("PYTHON_SERVICE_API_KEY", "stub")

from prompts import build_system_prompt, resolve_artifact_name  # noqa: E402


def test_resolve_alias_do_frontend():
    assert resolve_artifact_name("personas", "productCanvas") == "product_canvas"
    assert resolve_artifact_name("personas", "goals") == "goal_sketches"
    assert resolve_artifact_name("personas", "overallModel") == "overall_model_classes"


def test_page_override_vence_artifact():
    # Quando a página é productBacklog ou sprint, o artifact vem de page_name
    assert resolve_artifact_name("productBacklog", "personas") == "product_backlog"
    assert resolve_artifact_name("sprint", "stories") == "sprint"


def test_alias_desconhecido_cai_em_Artefato():
    assert resolve_artifact_name("qualquer", "coisa_inexistente") == "Artefato"


def test_build_system_prompt_inclui_contexto_essencial():
    data = {
        "project": {"id": 42, "title": "Meu Produto", "description": "Descrição curta"},
        "user": {"name": "Alice", "pivot": {"role": {"value": "facilitator"}}},
        "page_context": {"page": "personas", "artifact": "personas"},
    }

    prompt = build_system_prompt(data)

    assert "Alice" in prompt
    assert "facilitator" in prompt
    assert "Meu Produto" in prompt
    assert "personas" in prompt
    assert "42" in prompt  # project id


def test_build_system_prompt_sem_pivot_nao_quebra():
    # Alguns payloads vêm sem pivot ou sem role — o prompt deve degradar
    # graciosamente para "Não definido" em vez de estourar.
    data = {
        "project": {"id": 1, "title": "P", "description": ""},
        "user": {"name": "Bob"},
        "page_context": {"page": "goals", "artifact": "goals"},
    }

    prompt = build_system_prompt(data)

    assert "Bob" in prompt
    assert "Não definido" in prompt
    # goals é aliasado para goal_sketches
    assert "goal_sketches" in prompt
