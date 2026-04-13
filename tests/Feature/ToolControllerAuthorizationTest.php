<?php

use App\Enums\UserRole;
use App\Models\Project;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

/**
 * Cenário crítico da Fase 1 do plano de auditoria: mesmo com a API key
 * correta do py_service, o ToolController só pode devolver dados de um
 * projeto para um usuário que é membro desse projeto. Isso fecha o vetor
 * de prompt injection no chat IA (LLM alucinar project_id).
 */

beforeEach(function () {
    config(['services.python_chat_service.api_key' => 'test-python-key']);
});

function callArtifactTool(array $payload): \Illuminate\Testing\TestResponse
{
    return test()->withHeaders([
        'X-Internal-API-Key' => 'test-python-key',
        'Accept' => 'application/json',
    ])->postJson(route('tools.get_artifact_data'), $payload);
}

test('403 quando a API key está ausente', function () {
    $response = test()
        ->postJson(route('tools.get_artifact_data'), [
            'project_id' => 1,
            'artifact_name' => 'personas',
            'user_id' => 1,
        ]);

    $response->assertStatus(403);
});

test('403 quando o user_id não é membro do project_id alvo', function () {
    $memberA = User::factory()->create();
    $outsiderB = User::factory()->create();

    $project = Project::factory()->create();
    $project->users()->attach($memberA->id, ['role' => UserRole::ADMINISTRATOR]);

    $response = callArtifactTool([
        'project_id' => $project->id,
        'artifact_name' => 'personas',
        'user_id' => $outsiderB->id,
    ]);

    $response->assertStatus(403);
    $response->assertJson(['error' => 'Projeto não acessível a este usuário.']);
});

test('200 quando o user_id é membro do project_id', function () {
    $member = User::factory()->create();
    $project = Project::factory()->create();
    $project->users()->attach($member->id, ['role' => UserRole::ADMINISTRATOR]);

    $response = callArtifactTool([
        'project_id' => $project->id,
        'artifact_name' => 'personas',
        'user_id' => $member->id,
    ]);

    $response->assertStatus(200);
});

test('404 quando o artefato não é suportado', function () {
    $member = User::factory()->create();
    $project = Project::factory()->create();
    $project->users()->attach($member->id, ['role' => UserRole::ADMINISTRATOR]);

    $response = callArtifactTool([
        'project_id' => $project->id,
        'artifact_name' => 'artefato_que_nao_existe',
        'user_id' => $member->id,
    ]);

    $response->assertStatus(404);
});
