<?php

use App\Services\AI\ParsesLlmJson;

class ParsesGeminiJsonHarness
{
    use ParsesLlmJson;

    public function parse(string $content): array
    {
        return $this->extractJsonArray($content);
    }
}

test('aceita fence ```json ... ```', function () {
    $raw = <<<'RESP'
    ```json
    {"a": 1}
    ```
    RESP;
    expect((new ParsesGeminiJsonHarness())->parse($raw))->toBe(['a' => 1]);
});

test('aceita fence genérico ``` ... ```', function () {
    $raw = <<<'RESP'
    ```
    {"b": 2}
    ```
    RESP;
    expect((new ParsesGeminiJsonHarness())->parse($raw))->toBe(['b' => 2]);
});

test('aceita JSON cru sem fence', function () {
    expect((new ParsesGeminiJsonHarness())->parse('{"c": 3}'))->toBe(['c' => 3]);
});

test('lança JsonException em string inválida', function () {
    expect(fn() => (new ParsesGeminiJsonHarness())->parse('isso não é json'))
        ->toThrow(\JsonException::class);
});
