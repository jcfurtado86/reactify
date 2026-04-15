class NoopPostProcessor:
    """Opt-out: devolve o texto sem processar. Útil pra desligar o Qwen."""

    name = "noop"

    def clean(self, text: str) -> str:
        return text
