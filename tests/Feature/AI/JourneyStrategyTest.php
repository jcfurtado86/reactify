<?php

use App\Models\Project;
use App\Services\AI\Strategies\JourneyStrategy;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('parseResponse devolve journeys', function () {
    $raw = <<<'RESP'
    {
        "journeys": [
            {
                "title": "Assistir filme",
                "steps": [
                    {"description": "Abrir app", "is_touchpoint": false},
                    {"description": "Clicar no filme", "is_touchpoint": true}
                ]
            }
        ]
    }
    RESP;

    $parsed = (new JourneyStrategy())->parseResponse($raw);

    expect($parsed['journeys'])->toHaveCount(1);
    expect($parsed['journeys'][0]['steps'])->toHaveCount(2);
});

test('parseResponse lança sem journeys', function () {
    expect(fn() => (new JourneyStrategy())->parseResponse('{"x":[]}'))
        ->toThrow(\Exception::class, 'journeys');
});

test('enrichGeneratedItem preserva title e normaliza steps (is_touchpoint bool)', function () {
    $project = Project::create(['title' => 'Test Project', 'description' => 'desc', 'status' => 'active', 'active' => true]);
    $persona = (object) ['id' => 1, 'name' => 'Alice'];

    $generated = [
        'title' => 'Jornada X',
        'steps' => [
            ['description' => 'passo 1'],
            ['description' => 'passo 2', 'is_touchpoint' => 1],
            ['description' => 'passo 3', 'is_touchpoint' => false],
        ],
    ];

    $enriched = (new JourneyStrategy())
        ->enrichGeneratedItem($generated, $persona, $project, []);

    expect($enriched['title'])->toBe('Jornada X');
    expect($enriched['steps'])->toHaveCount(3);
    expect($enriched['steps'][0]['is_touchpoint'])->toBeFalse();
    expect($enriched['steps'][1]['is_touchpoint'])->toBeTrue();
    expect($enriched['steps'][2]['is_touchpoint'])->toBeFalse();
});

test('enrichGeneratedItem descarta steps sem description', function () {
    $project = Project::create(['title' => 'Test Project', 'description' => 'desc', 'status' => 'active', 'active' => true]);
    $persona = (object) ['id' => 1];

    $generated = [
        'title' => 'Y',
        'steps' => [
            ['description' => 'válido'],
            ['is_touchpoint' => true], // sem description
            ['description' => 'também válido'],
        ],
    ];

    $enriched = (new JourneyStrategy())
        ->enrichGeneratedItem($generated, $persona, $project, []);

    expect($enriched['steps'])->toHaveCount(2);
});

test('enrichGeneratedItem retorna stub quando a journey está malformada', function () {
    $project = Project::create(['title' => 'Test Project', 'description' => 'desc', 'status' => 'active', 'active' => true]);
    $persona = (object) ['id' => 5];

    // Sem title / steps
    $enriched = (new JourneyStrategy())
        ->enrichGeneratedItem([], $persona, $project, []);

    expect($enriched['title'])->toBe('');
    expect($enriched['steps'])->toBeArray()->toBeEmpty();
});

test('itemResponseKey e aggregateResponseKey são journeys', function () {
    $s = new JourneyStrategy();
    expect($s->itemResponseKey())->toBe('journeys');
    expect($s->aggregateResponseKey())->toBe('journeys');
});
