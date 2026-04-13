"""
Testes unitários para `tools.py`: sanitização de dados e construção
das tools (sem chamar o Laravel real).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("DATABASE_URL", "postgresql://stub")
os.environ.setdefault("LARAVEL_TOOL_API_URL", "http://stub")
os.environ.setdefault("PYTHON_SERVICE_API_KEY", "stub")

from tools import sanitize_data, VALID_ARTIFACTS, make_agent_tools  # noqa: E402


def test_sanitize_remove_campos_sensiveis():
    raw = {
        "id": 1,
        "name": "Alice",
        "email": "alice@example.com",
        "password": "hash",
        "pivot": {"role": "admin"},
        "created_at": "2026-01-01",
        "updated_at": "2026-01-01",
    }

    clean = sanitize_data(raw)

    assert clean["name"] == "Alice"
    assert "email" not in clean
    assert "pivot" not in clean
    assert "created_at" not in clean
    assert "updated_at" not in clean


def test_sanitize_preserva_campos_legitimos_em_estrutura_aninhada():
    raw = {
        "id": 1,
        "personas": [
            {"id": 10, "name": "Bob", "created_at": "X"},
            {"id": 20, "name": "Carol", "created_at": "X"},
        ],
    }

    clean = sanitize_data(raw)

    assert clean["id"] == 1
    assert len(clean["personas"]) == 2
    assert clean["personas"][0]["name"] == "Bob"
    assert "created_at" not in clean["personas"][0]


def test_sanitize_drop_null_values():
    clean = sanitize_data({"a": 1, "b": None, "c": 0})
    assert "b" not in clean
    assert clean["a"] == 1
    # 0 é falsy mas não None — deve permanecer
    assert clean["c"] == 0


def test_valid_artifacts_contem_lista_esperada():
    esperados = {"personas", "journeys", "stories", "product_canvas", "interviews"}
    assert esperados.issubset(set(VALID_ARTIFACTS))


def test_make_agent_tools_retorna_2_tools_sem_extras():
    tools = make_agent_tools(user_id=7, project_id=42)
    assert len(tools) == 2
    names = {t.name for t in tools}
    assert "get_data_from_artifact" in names
    assert "get_data_from_interview" in names


def test_make_agent_tools_inclui_extras_quando_passado():
    from langchain.tools import tool

    @tool
    def dummy_extra(query: str) -> str:
        """dummy tool."""
        return query

    tools = make_agent_tools(user_id=1, project_id=1, extra_tools=[dummy_extra])
    assert len(tools) == 3
    assert any(t.name == "dummy_extra" for t in tools)
