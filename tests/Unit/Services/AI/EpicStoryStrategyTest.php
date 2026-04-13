<?php

use App\Services\AI\Strategies\EpicStoryStrategy;

test('parseResponse aceita formato esperado com decomposed_epics', function () {
    $raw = <<<'RESP'
    ```json
    {
        "decomposed_epics": [
            {
                "original_epic_id": 10,
                "original_epic_title": "Epic original",
                "new_stories": [
                    {"title": "Story menor 1", "type": "user"},
                    {"title": "Story menor 2", "type": "user"}
                ]
            }
        ]
    }
    ```
    RESP;

    $parsed = (new EpicStoryStrategy())->parseResponse($raw);

    expect($parsed['decomposed_epics'])->toHaveCount(1);
    expect($parsed['decomposed_epics'][0]['original_epic_id'])->toBe(10);
    expect($parsed['decomposed_epics'][0]['new_stories'])->toHaveCount(2);
});

test('parseResponse aceita array vazio quando nenhum épico foi decomposto', function () {
    $parsed = (new EpicStoryStrategy())->parseResponse('{"decomposed_epics":[]}');
    expect($parsed['decomposed_epics'])->toBeArray()->toBeEmpty();
});

test('parseResponse lança quando falta decomposed_epics', function () {
    expect(fn() => (new EpicStoryStrategy())->parseResponse('{"foo":[]}'))
        ->toThrow(\Exception::class, 'decomposed_epics');
});

test('responseKeys devolve apenas decomposed_epics', function () {
    expect((new EpicStoryStrategy())->responseKeys())->toBe(['decomposed_epics']);
});
