<?php

namespace App\Services\AI;

use App\Models\Project;

/**
 * Contrato único para geradores de artefato via Gemini.
 *
 * Cada artefato (Stories, Personas, Goals, etc) implementa esta interface
 * com a sua lógica específica (regras de validação, como montar o contexto,
 * o prompt e como parsear a resposta). Toda a parte de chamar a API do
 * Gemini e tratar erros vive no GeminiGeneratorService.
 */
interface GeneratorStrategy
{
    /**
     * Regras de validação adicionais (além de project_id).
     *
     * @return array<string, mixed>
     */
    public function validationRules(): array;

    /**
     * Verifica pré-requisitos no projeto antes de chamar a IA.
     *
     * Devolve uma lista de strings descrevendo itens ausentes. Se a lista
     * não for vazia, o service responde 422 sem chamar Gemini. Um array
     * vazio significa "tudo pronto, pode gerar".
     *
     * @return array<int, string>
     */
    public function missingPrerequisites(Project $project, array $validated): array;

    /**
     * Monta o contexto que será injetado no prompt. Pode retornar
     * qualquer estrutura que o `buildPrompt` saiba consumir.
     */
    public function buildContext(Project $project, array $validated): mixed;

    /**
     * Retorna o prompt completo (já com contexto) a ser enviado ao Gemini.
     */
    public function buildPrompt(mixed $context): string;

    /**
     * Converte a resposta bruta (texto) do Gemini para um array PHP.
     * Deve lançar exceção se a resposta for inválida.
     *
     * @return array<string, mixed>
     */
    public function parseResponse(string $responseText): array;

    /**
     * Chaves de topo no JSON de resposta devolvido ao frontend.
     * Ex: ['personas'], ['crc_cards', 'overall_model_classes'].
     *
     * O service pluca cada chave do array parseado e devolve todas
     * aninhadas no envelope `{status: 'sucesso', ...}`.
     *
     * @return array<int, string>
     */
    public function responseKeys(): array;

    /**
     * Pós-processamento opcional dos dados parseados antes de devolver
     * ao frontend. Pode enriquecer itens (ex: injetar project_id em cada
     * story), persistir algo, etc. Recebe o array já parseado e devolve
     * o array final.
     */
    public function postProcess(array $parsed, Project $project, array $validated): array;

    /**
     * Persiste as rows geradas pela IA diretamente nas tabelas do
     * artefato, com `is_ai_generated = true`. Chamado pelo
     * AbstractLlmGeneratorService::runAndPersist() depois do parse +
     * postProcess. O usuário revisa/aprova depois via UI.
     */
    public function persistGenerated(array $parsed, Project $project, array $validated): void;

    /**
     * Rótulo curto usado em logs ("Personas", "Stories"...).
     */
    public function label(): string;
}
