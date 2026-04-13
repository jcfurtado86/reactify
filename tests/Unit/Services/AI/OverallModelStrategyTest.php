<?php

use App\Services\AI\Strategies\OverallModelStrategy;

test('parseResponse exige crc_cards E overall_model_classes', function () {
    $raw = <<<'RESP'
    {
        "crc_cards": [
            {"class": "Filme", "responsabilities": ["Armazenar"], "collaborators": ["Avaliacao"]}
        ],
        "overall_model_classes": [
            {"name": "Filme"},
            {"name": "Avaliacao"}
        ]
    }
    RESP;

    $parsed = (new OverallModelStrategy())->parseResponse($raw);

    expect($parsed['crc_cards'])->toHaveCount(1);
    expect($parsed['overall_model_classes'])->toHaveCount(2);
});

test('parseResponse lança se faltar crc_cards', function () {
    $raw = '{"overall_model_classes": []}';
    expect(fn() => (new OverallModelStrategy())->parseResponse($raw))
        ->toThrow(\Exception::class);
});

test('parseResponse lança se faltar overall_model_classes', function () {
    $raw = '{"crc_cards": []}';
    expect(fn() => (new OverallModelStrategy())->parseResponse($raw))
        ->toThrow(\Exception::class);
});

test('responseKeys devolve ambas as chaves para projeção direta', function () {
    expect((new OverallModelStrategy())->responseKeys())
        ->toBe(['crc_cards', 'overall_model_classes']);
});

test('label é Overall Model', function () {
    expect((new OverallModelStrategy())->label())->toBe('Overall Model');
});
