"""
Entrypoint Flask do serviço de chat.

Responsável apenas pelo transporte HTTP: recebe o payload do Laravel,
delega a construção do system prompt e do agente para os módulos
especializados (prompts, agent, tools, rag) e devolve a resposta final.

Toda a lógica de negócio vive nos módulos vizinhos — testável sem
subir Flask.
"""
from flask import Flask, Response, jsonify, request

from config import Config
from prompts import build_system_prompt
from agent import build_agent_for_request, build_chat_history, extract_final_answer

Config.validate()

app = Flask(__name__)


@app.route("/chat-stream", methods=["POST"])
def chat_stream():
    if not request.json:
        return jsonify({"error": "Requisição inválida"}), 400

    try:
        request_data = request.json

        user_id = (request_data.get("user") or {}).get("id")
        project_id = (request_data.get("project") or {}).get("id")
        if not user_id or not project_id:
            app.logger.error(
                "Payload sem user.id ou project.id — não é possível montar tools seguras."
            )
            return (
                jsonify(
                    {"error": "Contexto incompleto: user.id e project.id são obrigatórios."}
                ),
                400,
            )

        system_prompt = build_system_prompt(request_data)
        chat_history_raw = request_data.get("history", [])
        langchain_messages = build_chat_history(chat_history_raw)

        # Se por algum motivo a última mensagem não for humana (ex: o front
        # não enviou history), injetamos `message` como última humana.
        from langchain_core.messages import HumanMessage

        if not langchain_messages or not isinstance(langchain_messages[-1], HumanMessage):
            user_input = request_data.get("message", "")
            if not user_input:
                return jsonify({"error": "Mensagem do usuário vazia"}), 400
            langchain_messages.append(HumanMessage(content=user_input))

        agent = build_agent_for_request(
            user_id=user_id,
            project_id=project_id,
            system_prompt=system_prompt,
        )

        app.logger.info("--- Invocando Agente ---")
        response = agent.invoke({"messages": langchain_messages})
        app.logger.info("--- Agente Concluído ---")

        final_answer = extract_final_answer(response) or "Erro: Não consegui processar uma resposta."

        def stream_text_generator(text):
            yield text
            app.logger.info("Resposta completa enviada ao Laravel.")

        return Response(stream_text_generator(final_answer), mimetype="text/plain")

    except Exception as e:
        app.logger.error(f"Erro GERAL no endpoint /chat-stream: {e}", exc_info=True)
        error_message = f"Erro crítico no servidor de IA: {str(e)}"

        def stream_error_generator(text):
            yield text

        return Response(stream_error_generator(error_message), mimetype="text/plain", status=500)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=Config.CHAT_SERVICE_PORT, debug=Config.FLASK_DEBUG)
