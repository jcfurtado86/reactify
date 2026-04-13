<?php

use App\Services\AI\Strategies\PersonaStrategy;

test('parseResponse aceita JSON com fence', function () {
    $raw = <<<'RESP'
    ```json
    {
        "personas": [
            {"name": "Alice", "profile": ["dev"], "expectations": [], "goals": []}
        ]
    }
    ```
    RESP;

    $parsed = (new PersonaStrategy())->parseResponse($raw);

    expect($parsed['personas'])->toHaveCount(1);
    expect($parsed['personas'][0]['name'])->toBe('Alice');
});

test('parseResponse aceita JSON cru', function () {
    $raw = '{"personas":[{"name":"Bob"}]}';

    $parsed = (new PersonaStrategy())->parseResponse($raw);

    expect($parsed['personas'][0]['name'])->toBe('Bob');
});

test('parseResponse lança exceção sem a chave personas', function () {
    expect(fn() => (new PersonaStrategy())->parseResponse('{"other":[]}'))
        ->toThrow(\Exception::class, 'personas');
});

test('responseKeys devolve apenas personas', function () {
    expect((new PersonaStrategy())->responseKeys())->toBe(['personas']);
});

test('label é Personas', function () {
    expect((new PersonaStrategy())->label())->toBe('Personas');
});

test('validationRules é vazio — só project_id vem do service', function () {
    expect((new PersonaStrategy())->validationRules())->toBe([]);
});
