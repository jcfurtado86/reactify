<?php

use App\Models\Project;
use App\Services\AI\Strategies\BusinessRuleStrategy;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('parseResponse devolve business_rules', function () {
    $raw = '{"business_rules": [{"title": "Regra A"}, {"title": "Regra B"}]}';

    $parsed = (new BusinessRuleStrategy())->parseResponse($raw);

    expect($parsed['business_rules'])->toHaveCount(2);
});

test('parseResponse lança sem business_rules', function () {
    expect(fn() => (new BusinessRuleStrategy())->parseResponse('{"x":[]}'))
        ->toThrow(\Exception::class, 'business_rules');
});

test('enrichGeneratedItem injeta story_id (da story iterada) e project_id', function () {
    $project = Project::create(['title' => 'Test Project', 'description' => 'desc', 'status' => 'active', 'active' => true]);
    $story = (object) ['id' => 77, 'title' => 'Minha story', 'type' => 'user'];

    $enriched = (new BusinessRuleStrategy())->enrichGeneratedItem(
        ['title' => 'Regra nova'],
        $story,
        $project,
        [],
    );

    expect($enriched['story_id'])->toBe(77);
    expect($enriched['project_id'])->toBe($project->id);
    expect($enriched['title'])->toBe('Regra nova');
});

test('itemResponseKey e aggregateResponseKey são business_rules', function () {
    $s = new BusinessRuleStrategy();
    expect($s->itemResponseKey())->toBe('business_rules');
    expect($s->aggregateResponseKey())->toBe('business_rules');
});

test('label é Regras de Negócio', function () {
    expect((new BusinessRuleStrategy())->label())->toBe('Regras de Negócio');
});
