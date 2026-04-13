"""
Tools do agente: `get_data_from_artifact` e `get_data_from_interview`.

Ambas são construídas via `make_agent_tools(user_id, project_id)` que fecha
sobre o contexto autenticado. O LLM não recebe nem `user_id` nem `project_id`
nas assinaturas — assim não tem como fabricar IDs via prompt injection.

O Laravel ainda valida membership de novo no ToolController (defesa dupla).
"""
import json
import requests
from langchain.tools import tool
from langchain_core.tracers.langchain import wait_for_all_tracers
from config import Config

VALID_ARTIFACTS = [
    "product_canvas",
    "goal_sketches",
    "personas",
    "journeys",
    "stories",
    "overall_model_classes",
    "prioritizations",
    "change_requests",
    "epic_stories",
    "business_rules",
    "usage_scenarios",
    "system_interfaces",
    "storyboards",
    "sprint",
    "product_backlog",
    "interviews",
]

_SENSITIVE_KEYS = {
    "created_at",
    "updated_at",
    "deleted_at",
    "email_verified_at",
    "two_factor_secret",
    "two_factor_recovery_codes",
    "remember_token",
    "profile_photo_path",
    "email",
    "pivot",
}


def sanitize_data(data):
    """
    Remove campos técnicos do Laravel (timestamps, soft deletes, pivots,
    dados pessoais) para limpar o contexto enviado ao LLM.
    """
    if isinstance(data, dict):
        return {
            k: sanitize_data(v)
            for k, v in data.items()
            if k not in _SENSITIVE_KEYS and v is not None
        }
    if isinstance(data, list):
        return [sanitize_data(item) for item in data]
    return data


def _call_laravel_tool(artifact_name: str, project_id: int, user_id: int) -> str:
    if not Config.PYTHON_SERVICE_API_KEY:
        return "Erro de configuração: PYTHON_SERVICE_API_KEY não definida no .env"
    try:
        response = requests.post(
            Config.LARAVEL_TOOL_API_URL,
            headers={
                "X-Internal-API-Key": Config.PYTHON_SERVICE_API_KEY,
                "Accept": "application/json",
            },
            json={
                "artifact_name": artifact_name,
                "project_id": project_id,
                "user_id": user_id,
            },
        )
        response.raise_for_status()
        wait_for_all_tracers()

        raw_data = response.json()
        clean_data = sanitize_data(raw_data)
        print(
            f"✅ Dados limpos recebidos ({artifact_name}). "
            f"Tamanho reduzido de {len(str(raw_data))} para {len(str(clean_data))} caracteres."
        )
        return json.dumps(clean_data, ensure_ascii=False)
    except requests.exceptions.HTTPError as e:
        print(f"Erro HTTP: {e.response.text}")
        return f"Erro ao buscar dados: {e.response.status_code} - {e.response.text}"
    except Exception as e:
        print(f"Erro inesperado na ferramenta: {str(e)}")
        return f"Erro ao chamar a ferramenta: {str(e)}"


def make_agent_tools(user_id: int, project_id: int, extra_tools: list | None = None):
    """
    Constrói o conjunto de tools do agente com user_id/project_id
    capturados via closure. `extra_tools` permite injetar tools adicionais
    (ex: search_knowledge_base do rag.py).
    """

    @tool
    def get_data_from_artifact(artifact_name: str) -> str:
        """
        Busca os dados (em JSON) de um artefato específico
        (como 'Personas', 'Goals', 'Journeys', 'Stories') do projeto atual
        do usuário. Use esta ferramenta sempre que o usuário perguntar
        sobre dados específicos do projeto.

        Args:
            artifact_name: O nome técnico do artefato. Deve ser um dos
                listados abaixo:
                - product_canvas
                - goal_sketches
                - personas
                - journeys
                - stories
                - overall_model_classes
                - prioritizations
                - change_requests
                - epic_stories
                - business_rules
                - usage_scenarios
                - system_interfaces
                - storyboards
                - sprint
                - product_backlog
                - interviews
        """
        print(
            f"🔎 --- Tool Call: get_data_from_artifact("
            f"artifact='{artifact_name}', project_id={project_id}, user_id={user_id}) ---"
        )
        if artifact_name not in VALID_ARTIFACTS:
            print(f"Artefato '{artifact_name}' inválido.")
            return (
                f"Artefato '{artifact_name}' inválido. "
                f"Escolha entre: {', '.join(VALID_ARTIFACTS)}"
            )
        return _call_laravel_tool(artifact_name, project_id, user_id)

    @tool
    def get_data_from_interview() -> str:
        """
        Busca os dados (em JSON) das entrevistas de requisitos do projeto
        atual do usuário. Use quando a pergunta envolver dores, necessidades
        ou falas dos stakeholders levantadas em entrevistas.
        """
        print(
            f"🔎 --- Tool Call: get_data_from_interview("
            f"project_id={project_id}, user_id={user_id}) ---"
        )
        return _call_laravel_tool("interviews", project_id, user_id)

    tools = [get_data_from_artifact, get_data_from_interview]
    if extra_tools:
        tools.extend(extra_tools)
    return tools
