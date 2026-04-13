<?php

use App\Models\OverallModelClass;
use App\Models\Project;
use App\Services\AI\Strategies\SystemInterfaceStrategy;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('parseResponse devolve system_interfaces', function () {
    $raw = <<<'RESP'
    {
        "system_interfaces": [
            {
                "title": "API de Pagamento",
                "input": "dados do cartão",
                "output": "transacao",
                "type": "external",
                "related_classes": ["Pedido"]
            }
        ]
    }
    RESP;

    $parsed = (new SystemInterfaceStrategy())->parseResponse($raw);

    expect($parsed['system_interfaces'])->toHaveCount(1);
    expect($parsed['system_interfaces'][0]['type'])->toBe('external');
});

test('parseResponse lança sem system_interfaces', function () {
    expect(fn() => (new SystemInterfaceStrategy())->parseResponse('{"foo":[]}'))
        ->toThrow(\Exception::class, 'system_interfaces');
});

test('postProcess converte related_classes (nomes) em overall_model_class_ids', function () {
    $project = Project::create(['title' => 'Test Project', 'description' => 'desc', 'status' => 'active', 'active' => true]);
    OverallModelClass::create(['project_id' => $project->id, 'name' => 'Pedido']);
    OverallModelClass::create(['project_id' => $project->id, 'name' => 'Cliente']);

    $parsed = [
        'system_interfaces' => [
            [
                'title' => 'API X',
                'related_classes' => ['Pedido', 'Cliente', 'NaoExiste'],
            ],
        ],
    ];

    $result = (new SystemInterfaceStrategy())->postProcess($parsed, $project, []);

    $iface = $result['system_interfaces'][0];
    expect($iface)->not->toHaveKey('related_classes');
    expect($iface['overall_model_class_ids'])->toHaveCount(2); // 'NaoExiste' é dropado
});

test('postProcess preserva lista vazia quando related_classes falta', function () {
    $project = Project::create(['title' => 'Test Project', 'description' => 'desc', 'status' => 'active', 'active' => true]);

    $parsed = [
        'system_interfaces' => [
            ['title' => 'API Y'],
        ],
    ];

    $result = (new SystemInterfaceStrategy())->postProcess($parsed, $project, []);

    expect($result['system_interfaces'][0]['overall_model_class_ids'])->toBe([]);
});

test('responseKeys devolve apenas system_interfaces', function () {
    expect((new SystemInterfaceStrategy())->responseKeys())->toBe(['system_interfaces']);
});
