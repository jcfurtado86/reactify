<?php

use App\Services\AI\Strategies\GoalStrategy;

test('parseResponse aceita JSON com fence json', function () {
    $raw = <<<'RESP'
    ```json
    {
        "goals": [
            {"title": "Aumentar engajamento", "type": "bg", "priority": "high"}
        ]
    }
    ```
    RESP;

    $parsed = (new GoalStrategy())->parseResponse($raw);

    expect($parsed['goals'])->toHaveCount(1);
    expect($parsed['goals'][0]['type'])->toBe('bg');
    expect($parsed['goals'][0]['priority'])->toBe('high');
});

test('parseResponse aceita lista vazia', function () {
    $parsed = (new GoalStrategy())->parseResponse('{"goals":[]}');
    expect($parsed['goals'])->toBeArray()->toBeEmpty();
});

test('parseResponse lança quando falta goals', function () {
    expect(fn() => (new GoalStrategy())->parseResponse('{"result":[]}'))
        ->toThrow(\Exception::class, 'goals');
});

test('responseKeys devolve apenas goals', function () {
    expect((new GoalStrategy())->responseKeys())->toBe(['goals']);
});

test('label é Goals', function () {
    expect((new GoalStrategy())->label())->toBe('Goals');
});
