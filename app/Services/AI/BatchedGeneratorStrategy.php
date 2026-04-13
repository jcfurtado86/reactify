<?php

namespace App\Services\AI;

use App\Models\Project;

/**
 * Variação do GeneratorStrategy para fluxos que iteram sobre um conjunto
 * de itens (uma chamada ao Gemini por item). Usado pelos geradores de
 * Business Rules, Usage Scenarios e Journeys.
 */
interface BatchedGeneratorStrategy
{
    public function validationRules(): array;

    public function label(): string;

    /** @return array<int, string> */
    public function missingPrerequisites(Project $project, array $validated): array;

    /**
     * Itens sobre os quais iterar (ex: stories, personas).
     *
     * @return iterable<mixed>
     */
    public function items(Project $project, array $validated): iterable;

    /**
     * Contexto compartilhado entre todas as iterações (ex: transcrições
     * de entrevista, goals do projeto). Retornado uma vez e reutilizado
     * em cada item.
     */
    public function sharedContext(Project $project, array $validated): mixed;

    /**
     * Monta o prompt para um item específico.
     */
    public function buildPromptForItem(mixed $item, mixed $sharedContext, Project $project): string;

    /**
     * Parseia a resposta do Gemini para um item. Deve devolver um array
     * com a mesma chave de topo de `itemResponseKey()` contendo a lista
     * de objetos gerados para aquele item.
     */
    public function parseResponse(string $responseText): array;

    /**
     * Chave interna no retorno parseado (ex: 'business_rules').
     */
    public function itemResponseKey(): string;

    /**
     * Chave de topo agregada devolvida ao frontend (normalmente igual
     * ao itemResponseKey, mas separada para flexibilidade).
     */
    public function aggregateResponseKey(): string;

    /**
     * Enriquece cada item gerado (ex: injeta project_id, story_id).
     * Recebe um item gerado e o item original que o gerou.
     */
    public function enrichGeneratedItem(array $generated, mixed $sourceItem, Project $project, array $validated): array;
}
