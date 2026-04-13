<?php

use App\Models\Interview;
use App\Models\Project;
use App\Models\Story;
use App\Services\AI\GeminiGeneratorService;
use App\Services\AI\Strategies\BusinessRuleStrategy;
use App\Services\AI\Strategies\ProductCanvasStrategy;
use Gemini\Laravel\Facades\Gemini;
use Gemini\Responses\GenerativeModel\GenerateContentResponse;
use Illuminate\Http\Request;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

/**
 * Fakes a GenerateContentResponse with a single candidate carrying `text`.
 */
function fakeGeminiText(string $text): GenerateContentResponse
{
    return GenerateContentResponse::fake([
        'candidates' => [
            ['content' => ['parts' => [['text' => $text]]]],
        ],
    ]);
}

test('retorna 422 quando project_id é inválido', function () {
    Gemini::fake([]);

    $service = app(GeminiGeneratorService::class);
    $request = Request::create('/fake', 'POST', ['project_id' => 99999]);

    $response = $service->generate(new ProductCanvasStrategy(), $request);

    expect($response->getStatusCode())->toBe(422);
});

test('retorna 422 com itens_faltantes quando faltam pré-requisitos', function () {
    Gemini::fake([]);

    $project = Project::create(['title' => 'Test Project', 'description' => 'desc', 'status' => 'active', 'active' => true]);
    // sem interview → ProductCanvasStrategy deve bloquear

    $service = app(GeminiGeneratorService::class);
    $request = Request::create('/fake', 'POST', ['project_id' => $project->id]);

    $response = $service->generate(new ProductCanvasStrategy(), $request);

    expect($response->getStatusCode())->toBe(422);
    $payload = $response->getData(true);
    expect($payload['status'])->toBe('warning');
    expect($payload['itens_faltantes'])->not->toBeEmpty();
});

test('generate chama Gemini e monta envelope com a chave certa', function () {
    $project = Project::create(['title' => 'Test Project', 'description' => 'desc', 'status' => 'active', 'active' => true]);
    Interview::create([
        'project_id' => $project->id,
        'file_name' => 'fake.mp3',
        'file_path' => '/tmp/fake.mp3',
        'transcript' => 'contexto de entrevista',
        'extraction_status' => 'completed',
    ]);

    Gemini::fake([
        fakeGeminiText(json_encode([
            'product_canvas' => [
                ['key' => 'issues', 'label' => 'Problems', 'value' => 'dor X'],
                ['key' => 'solutions', 'label' => 'Solutions', 'value' => 'sol Y'],
            ],
        ])),
    ]);

    $service = app(GeminiGeneratorService::class);
    $request = Request::create('/fake', 'POST', ['project_id' => $project->id]);

    $response = $service->generate(new ProductCanvasStrategy(), $request);

    expect($response->getStatusCode())->toBe(200);
    $payload = $response->getData(true);
    expect($payload['status'])->toBe('sucesso');
    expect($payload['product_canvas'])->toHaveCount(2);
    expect($payload['product_canvas'][0]['key'])->toBe('issues');
});

test('generate devolve 500 quando o parser falha', function () {
    $project = Project::create(['title' => 'Test Project', 'description' => 'desc', 'status' => 'active', 'active' => true]);
    Interview::create([
        'project_id' => $project->id,
        'file_name' => 'fake.mp3',
        'file_path' => '/tmp/fake.mp3',
        'transcript' => 'x',
        'extraction_status' => 'completed',
    ]);

    Gemini::fake([
        fakeGeminiText('isso nao eh json'),
    ]);

    $service = app(GeminiGeneratorService::class);
    $request = Request::create('/fake', 'POST', ['project_id' => $project->id]);

    $response = $service->generate(new ProductCanvasStrategy(), $request);

    expect($response->getStatusCode())->toBe(500);
    expect($response->getData(true)['status'])->toBe('error');
});

test('generateBatched itera sobre stories e agrega os resultados', function () {
    $project = Project::create(['title' => 'Test Project', 'description' => 'desc', 'status' => 'active', 'active' => true]);
    Interview::create([
        'project_id' => $project->id,
        'file_name' => 'fake.mp3',
        'file_path' => '/tmp/fake.mp3',
        'transcript' => 'contexto',
        'extraction_status' => 'completed',
    ]);

    Story::create([
        'project_id' => $project->id,
        'title' => 'Story A',
        'type' => 'user',
    ]);
    Story::create([
        'project_id' => $project->id,
        'title' => 'Story B',
        'type' => 'system',
    ]);

    // Uma resposta por story
    Gemini::fake([
        fakeGeminiText(json_encode([
            'business_rules' => [['title' => 'Regra para A']],
        ])),
        fakeGeminiText(json_encode([
            'business_rules' => [
                ['title' => 'Regra 1 para B'],
                ['title' => 'Regra 2 para B'],
            ],
        ])),
    ]);

    $service = app(GeminiGeneratorService::class);
    $request = Request::create('/fake', 'POST', ['project_id' => $project->id]);

    $response = $service->generateBatched(new BusinessRuleStrategy(), $request);

    expect($response->getStatusCode())->toBe(200);
    $payload = $response->getData(true);
    expect($payload['business_rules'])->toHaveCount(3);

    // Cada regra deve ter story_id e project_id injetados pelo enrichGeneratedItem
    foreach ($payload['business_rules'] as $rule) {
        expect($rule)->toHaveKey('story_id');
        expect($rule['project_id'])->toBe($project->id);
    }
});
