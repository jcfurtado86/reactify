<?php

use App\Models\Project;
use App\Services\AI\Strategies\UsageScenarioStrategy;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('parseResponse devolve usage_scenarios', function () {
    $raw = <<<'RESP'
    {
        "usage_scenarios": [
            {
                "description": {
                    "as": "Admin",
                    "given": "logado",
                    "when": "clica",
                    "then_1": "vê confirmação"
                }
            }
        ]
    }
    RESP;

    $parsed = (new UsageScenarioStrategy())->parseResponse($raw);

    expect($parsed['usage_scenarios'])->toHaveCount(1);
    expect($parsed['usage_scenarios'][0]['description']['as'])->toBe('Admin');
});

test('parseResponse lança sem usage_scenarios', function () {
    expect(fn() => (new UsageScenarioStrategy())->parseResponse('{"x":[]}'))
        ->toThrow(\Exception::class, 'usage_scenarios');
});

test('enrichGeneratedItem injeta story_id + project_id', function () {
    $project = Project::create(['title' => 'Test Project', 'description' => 'desc', 'status' => 'active', 'active' => true]);
    $story = (object) ['id' => 42];

    $enriched = (new UsageScenarioStrategy())->enrichGeneratedItem(
        ['description' => ['as' => 'user']],
        $story,
        $project,
        [],
    );

    expect($enriched['story_id'])->toBe(42);
    expect($enriched['project_id'])->toBe($project->id);
});
