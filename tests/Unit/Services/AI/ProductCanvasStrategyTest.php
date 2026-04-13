<?php

use App\Services\AI\Strategies\ProductCanvasStrategy;

/**
 * Testes unitários da ProductCanvasStrategy — piloto do padrão Q10.
 * Não dependem de banco nem de Gemini, só exercitam o parser.
 */

test('parseResponse aceita JSON dentro de fence ```json', function () {
    $strategy = new ProductCanvasStrategy();
    $raw = <<<'RESP'
    ```json
    {
        "product_canvas": [
            { "key": "issues", "label": "Problems", "value": "Dor X" }
        ]
    }
    ```
    RESP;

    $parsed = $strategy->parseResponse($raw);

    expect($parsed)->toHaveKey('product_canvas');
    expect($parsed['product_canvas'])->toBeArray()->toHaveCount(1);
    expect($parsed['product_canvas'][0]['key'])->toBe('issues');
});

test('parseResponse aceita JSON cru', function () {
    $strategy = new ProductCanvasStrategy();
    $raw = '{"product_canvas": [{"key":"solutions","value":"S"}]}';

    $parsed = $strategy->parseResponse($raw);

    expect($parsed['product_canvas'][0]['key'])->toBe('solutions');
});

test('parseResponse lança exceção quando falta product_canvas', function () {
    $strategy = new ProductCanvasStrategy();
    $raw = '{"other_key": []}';

    expect(fn() => $strategy->parseResponse($raw))
        ->toThrow(\Exception::class, "product_canvas");
});

test('responseKeys devolve apenas product_canvas', function () {
    expect((new ProductCanvasStrategy())->responseKeys())
        ->toBe(['product_canvas']);
});

test('label devolve nome amigável', function () {
    expect((new ProductCanvasStrategy())->label())
        ->toBe('Product Canvas');
});
