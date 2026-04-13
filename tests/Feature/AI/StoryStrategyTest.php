<?php

use App\Models\Project;
use App\Services\AI\Strategies\StoryStrategy;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('parseResponse embrulha o payload em message (contrato legado com o front)', function () {
    $raw = <<<'RESP'
    ```json
    {
        "stories": [
            {"title": "Assistir filme", "type": "user"},
            {"title": "Compressao de video", "type": "system"}
        ]
    }
    ```
    RESP;

    $parsed = (new StoryStrategy())->parseResponse($raw);

    // Contrato legado: o front lê `response.data.message.stories`
    expect($parsed)->toHaveKey('message');
    expect($parsed['message']['stories'])->toHaveCount(2);
});

test('parseResponse lança sem stories', function () {
    expect(fn() => (new StoryStrategy())->parseResponse('{"other":[]}'))
        ->toThrow(\Exception::class, 'stories');
});

test('postProcess injeta project_id e epic_id=null em cada story', function () {
    $project = Project::create(['title' => 'Test Project', 'description' => 'desc', 'status' => 'active', 'active' => true]);

    $parsed = [
        'message' => [
            'stories' => [
                ['title' => 'Story 1', 'type' => 'user'],
                ['title' => 'Story 2', 'type' => 'system'],
            ],
        ],
    ];

    $result = (new StoryStrategy())->postProcess($parsed, $project, []);

    foreach ($result['message']['stories'] as $s) {
        expect($s['project_id'])->toBe($project->id);
        expect($s['epic_id'])->toBeNull();
    }
});

test('responseKeys devolve message (envelope legado)', function () {
    expect((new StoryStrategy())->responseKeys())->toBe(['message']);
});

test('label é Stories', function () {
    expect((new StoryStrategy())->label())->toBe('Stories');
});
