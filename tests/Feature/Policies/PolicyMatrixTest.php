<?php

use App\Enums\UserRole;
use App\Models\BusinessRule;
use App\Models\ChangeRequest;
use App\Models\CrcCard;
use App\Models\Goal;
use App\Models\Journey;
use App\Models\MatrixPriority;
use App\Models\OverallModelClass;
use App\Models\Prioritization;
use App\Models\ProductCanvas;
use App\Models\Project;
use App\Models\Sprint;
use App\Models\Story;
use App\Models\SystemInterface;
use App\Models\User;
use App\Models\UsageScenario;

// ============================================================
// Teste end-to-end de enforcement: 4 papéis × todos os endpoints
// mutantes protegidos por $this->authorize().
//
// A matriz de permissões segue REACT-M (dissertação p.83-115).
// Se alguém tirar um authorize() de um controller ou mudar o
// enum, este teste quebra.
// ============================================================

function setupProject(string $role): array
{
    $project = Project::factory()->create();
    $user = User::factory()->create();
    $project->users()->attach($user->id, ['role' => $role]);

    ProductCanvas::create(['project_id' => $project->id]);

    return [$user, $project];
}

function makeStory(Project $project): Story
{
    return Story::create([
        'title' => 'Test Story',
        'type' => 'user',
        'project_id' => $project->id,
    ]);
}

// ===== HELPER: testa create (POST) de cada artefato =====
// expected: 'allowed' (302 redirect) ou 'denied' (403)

function assertCreate(string $role, string $routeName, array $payload, string $expected)
{
    [$user, $project] = setupProject($role);
    $payload['project_id'] = $project->id;

    $response = test()->actingAs($user)->post(route($routeName), $payload);

    if ($expected === 'denied') {
        expect($response->status())->toBe(403, "$role should be denied on $routeName (got {$response->status()})");
    } else {
        expect($response->status())->not->toBe(403, "$role should be allowed on $routeName (got {$response->status()})");
    }
}

function assertUpdate(string $role, string $routeName, $model, array $payload, string $expected)
{
    $response = test()->actingAs(
        User::find(
            $model->project->users()->first()->pivot->user_id
        ) ?? User::factory()->create()
    )->patch(route($routeName, $model), $payload);

    if ($expected === 'denied') {
        expect($response->status())->toBe(403, "$role denied on $routeName");
    } else {
        expect($response->status())->not->toBe(403, "$role allowed on $routeName");
    }
}

function assertDestroy(string $role, string $routeName, $model, string $expected)
{
    $response = test()->actingAs(
        User::find(
            $model->project->users()->first()->pivot->user_id
        ) ?? User::factory()->create()
    )->delete(route($routeName, $model));

    if ($expected === 'denied') {
        expect($response->status())->toBe(403, "$role denied on $routeName");
    } else {
        expect($response->status())->not->toBe(403, "$role allowed on $routeName");
    }
}

// ===========================
// PERSONA: manage = DE, Team
// ===========================

test('persona.store: customer denied', fn () => assertCreate('customer', 'persona.store', ['name' => 'P'], 'denied'));
test('persona.store: domain_expert allowed', fn () => assertCreate('domain_expert', 'persona.store', ['name' => 'P'], 'allowed'));
test('persona.store: team allowed', fn () => assertCreate('team', 'persona.store', ['name' => 'P'], 'allowed'));
test('persona.store: administrator allowed', fn () => assertCreate('administrator', 'persona.store', ['name' => 'P'], 'allowed'));

// ===========================
// GOAL: manage = DE only
// ===========================

test('goal.store: customer denied', fn () => assertCreate('customer', 'goal.store', ['title' => 'G', 'type' => 'bg', 'priority' => 'low'], 'denied'));
test('goal.store: domain_expert allowed', fn () => assertCreate('domain_expert', 'goal.store', ['title' => 'G', 'type' => 'bg', 'priority' => 'low'], 'allowed'));
test('goal.store: team denied', fn () => assertCreate('team', 'goal.store', ['title' => 'G', 'type' => 'bg', 'priority' => 'low'], 'denied'));
test('goal.store: administrator allowed', fn () => assertCreate('administrator', 'goal.store', ['title' => 'G', 'type' => 'bg', 'priority' => 'low'], 'allowed'));

// ===========================
// JOURNEY: manage = DE only
// ===========================

test('journey.store: customer denied', fn () => assertCreate('customer', 'journey.store', ['title' => 'J'], 'denied'));
test('journey.store: domain_expert allowed', fn () => assertCreate('domain_expert', 'journey.store', ['title' => 'J'], 'allowed'));
test('journey.store: team denied', fn () => assertCreate('team', 'journey.store', ['title' => 'J'], 'denied'));

// ===========================
// USER STORY: manage = DE, Team
// ===========================

test('story.store: customer denied', fn () => assertCreate('customer', 'story.store', ['title' => 'S', 'type' => 'user'], 'denied'));
test('story.store: domain_expert allowed', fn () => assertCreate('domain_expert', 'story.store', ['title' => 'S', 'type' => 'user'], 'allowed'));
test('story.store: team allowed', fn () => assertCreate('team', 'story.store', ['title' => 'S', 'type' => 'user'], 'allowed'));

// ===========================
// BUSINESS RULE: manage = DE, Team
// ===========================

test('business-rule.store: customer denied', function () {
    [$user, $project] = setupProject('customer');
    $story = makeStory($project);
    test()->actingAs($user)->post(route('business-rule.store'), [
        'title' => 'BR', 'story_id' => $story->id, 'project_id' => $project->id,
    ])->assertForbidden();
});

test('business-rule.store: team allowed', function () {
    [$user, $project] = setupProject('team');
    $story = makeStory($project);
    test()->actingAs($user)->post(route('business-rule.store'), [
        'title' => 'BR', 'story_id' => $story->id, 'project_id' => $project->id,
    ])->assertRedirect();
});

// ===========================
// USAGE SCENARIO: manage = DE, Team
// ===========================

test('usage-scenario.store: customer denied', function () {
    [$user, $project] = setupProject('customer');
    $story = makeStory($project);
    test()->actingAs($user)->post(route('usage-scenario.store'), [
        'description' => ['as' => 'a', 'given' => 'b', 'when' => 'c', 'then_1' => 'd'],
        'story_id' => $story->id, 'project_id' => $project->id,
    ])->assertForbidden();
});

test('usage-scenario.store: domain_expert allowed', function () {
    [$user, $project] = setupProject('domain_expert');
    $story = makeStory($project);
    test()->actingAs($user)->post(route('usage-scenario.store'), [
        'description' => ['as' => 'a', 'given' => 'b', 'when' => 'c', 'then_1' => 'd'],
        'story_id' => $story->id, 'project_id' => $project->id,
    ])->assertRedirect();
});

// ===========================
// OVERALL MODEL CLASS: manage = Team only
// ===========================

test('overall-model-class.store: customer denied', fn () => assertCreate('customer', 'overall-model-class.store', ['name' => 'C'], 'denied'));
test('overall-model-class.store: domain_expert denied', fn () => assertCreate('domain_expert', 'overall-model-class.store', ['name' => 'C'], 'denied'));
test('overall-model-class.store: team allowed', fn () => assertCreate('team', 'overall-model-class.store', ['name' => 'C'], 'allowed'));
test('overall-model-class.store: administrator allowed', fn () => assertCreate('administrator', 'overall-model-class.store', ['name' => 'C'], 'allowed'));

// ===========================
// CRC CARD (OverallModel): manage = Team only
// ===========================

test('overall.store: customer denied', fn () => assertCreate('customer', 'overall.store', [
    'class' => 'CRC', 'collaborators' => ['A'], 'responsabilities' => ['B'],
], 'denied'));
test('overall.store: domain_expert denied', fn () => assertCreate('domain_expert', 'overall.store', [
    'class' => 'CRC', 'collaborators' => ['A'], 'responsabilities' => ['B'],
], 'denied'));
test('overall.store: team allowed', fn () => assertCreate('team', 'overall.store', [
    'class' => 'CRC', 'collaborators' => ['A'], 'responsabilities' => ['B'],
], 'allowed'));

// ===========================
// SYSTEM INTERFACE: manage = Team only
// ===========================

test('system-interface.store: customer denied', fn () => assertCreate('customer', 'system-interface.store', [
    'title' => 'IF', 'input' => 'in', 'output' => 'out', 'type' => 'internal',
], 'denied'));
test('system-interface.store: domain_expert denied', fn () => assertCreate('domain_expert', 'system-interface.store', [
    'title' => 'IF', 'input' => 'in', 'output' => 'out', 'type' => 'internal',
], 'denied'));
test('system-interface.store: team allowed', fn () => assertCreate('team', 'system-interface.store', [
    'title' => 'IF', 'input' => 'in', 'output' => 'out', 'type' => 'internal',
], 'allowed'));

// ===========================
// MATRIX PRIORITY: manage = Customer, DE, Team
// ===========================

test('matrix-priority.store: customer allowed', fn () => assertCreate('customer', 'matrix-priority.store', [
    'name' => 'Alta', 'color' => '#ff0000',
], 'allowed'));
test('matrix-priority.store: team allowed', fn () => assertCreate('team', 'matrix-priority.store', [
    'name' => 'Alta', 'color' => '#ff0000',
], 'allowed'));

// ===========================
// PRIORITIZATION: manage = Customer, DE, Team
// ===========================

test('prioritization.store: customer allowed', function () {
    [$user, $project] = setupProject('customer');
    $story = makeStory($project);
    $priority = MatrixPriority::create([
        'name' => 'Alta', 'color' => '#ff0000', 'project_id' => $project->id, 'order_column' => 0,
    ]);
    test()->actingAs($user)->post(route('prioritization.store'), [
        'project_id' => $project->id,
        'story_id' => $story->id,
        'priority_id' => $priority->id,
        'position' => 0,
    ])->assertRedirect();
});

// ===========================
// CHANGE REQUEST: manage = Customer, DE, Team
// ===========================

test('change-request.store: customer allowed', fn () => assertCreate('customer', 'change-request.store', [
    'requester_name' => 'Teste', 'description' => 'Mudanca', 'request_date' => '2026-04-15',
], 'allowed'));
test('change-request.store: team allowed', fn () => assertCreate('team', 'change-request.store', [
    'requester_name' => 'Teste', 'description' => 'Mudanca', 'request_date' => '2026-04-15',
], 'allowed'));

// ===========================
// SPRINT: manage = Team only
// ===========================

test('sprint.store: customer denied', fn () => assertCreate('customer', 'sprint.store', [
    'name' => 'S1', 'start_date' => '2026-05-01', 'end_date' => '2026-05-15', 'status' => 'active',
], 'denied'));
test('sprint.store: domain_expert denied', fn () => assertCreate('domain_expert', 'sprint.store', [
    'name' => 'S1', 'start_date' => '2026-05-01', 'end_date' => '2026-05-15', 'status' => 'active',
], 'denied'));
test('sprint.store: team allowed', fn () => assertCreate('team', 'sprint.store', [
    'name' => 'S1', 'start_date' => '2026-05-01', 'end_date' => '2026-05-15', 'status' => 'active',
], 'allowed'));
test('sprint.store: administrator allowed', fn () => assertCreate('administrator', 'sprint.store', [
    'name' => 'S1', 'start_date' => '2026-05-01', 'end_date' => '2026-05-15', 'status' => 'active',
], 'allowed'));

// ===========================
// UPDATE & DESTROY (spot checks across artifacts)
// ===========================

test('goal.update: customer denied', function () {
    [$user, $project] = setupProject('customer');
    $goal = Goal::create(['title' => 'G', 'type' => 'bg', 'priority' => 'low', 'project_id' => $project->id]);
    test()->actingAs($user)->patch(route('goal.update', $goal), ['title' => 'G2'])->assertForbidden();
});

test('goal.update: domain_expert allowed', function () {
    [$user, $project] = setupProject('domain_expert');
    $goal = Goal::create(['title' => 'G', 'type' => 'bg', 'priority' => 'low', 'project_id' => $project->id]);
    test()->actingAs($user)->patch(route('goal.update', $goal), ['title' => 'G2'])->assertRedirect();
});

test('goal.destroy: team denied', function () {
    [$user, $project] = setupProject('team');
    $goal = Goal::create(['title' => 'G', 'type' => 'bg', 'priority' => 'low', 'project_id' => $project->id]);
    test()->actingAs($user)->delete(route('goal.delete', $goal))->assertForbidden();
});

test('story.destroy: customer denied', function () {
    [$user, $project] = setupProject('customer');
    $story = makeStory($project);
    test()->actingAs($user)->delete(route('story.delete', $story))->assertForbidden();
});

test('story.destroy: team allowed', function () {
    [$user, $project] = setupProject('team');
    $story = makeStory($project);
    test()->actingAs($user)->delete(route('story.delete', $story))->assertRedirect();
});

test('sprint.destroy: customer denied', function () {
    [$user, $project] = setupProject('customer');
    $sprint = Sprint::create([
        'name' => 'S', 'start_date' => '2026-05-01', 'end_date' => '2026-05-15',
        'status' => 'active', 'project_id' => $project->id,
    ]);
    test()->actingAs($user)->delete(route('sprint.destroy', $sprint))->assertForbidden();
});

test('sprint.destroy: team allowed', function () {
    [$user, $project] = setupProject('team');
    $sprint = Sprint::create([
        'name' => 'S', 'start_date' => '2026-05-01', 'end_date' => '2026-05-15',
        'status' => 'active', 'project_id' => $project->id,
    ]);
    test()->actingAs($user)->delete(route('sprint.destroy', $sprint))->assertRedirect();
});

test('change-request.destroy: customer allowed', function () {
    [$user, $project] = setupProject('customer');
    $cr = ChangeRequest::create([
        'project_id' => $project->id, 'requester_name' => 'T',
        'description' => 'X', 'request_date' => '2026-04-15',
    ]);
    test()->actingAs($user)->delete(route('change-request.destroy', $cr))->assertRedirect();
});

test('system-interface.destroy: domain_expert denied', function () {
    [$user, $project] = setupProject('domain_expert');
    $si = SystemInterface::create([
        'title' => 'IF', 'input' => 'in', 'output' => 'out',
        'type' => 'internal', 'project_id' => $project->id,
    ]);
    test()->actingAs($user)->delete(route('system-interface.destroy', $si))->assertForbidden();
});

test('system-interface.destroy: team allowed', function () {
    [$user, $project] = setupProject('team');
    $si = SystemInterface::create([
        'title' => 'IF', 'input' => 'in', 'output' => 'out',
        'type' => 'internal', 'project_id' => $project->id,
    ]);
    test()->actingAs($user)->delete(route('system-interface.destroy', $si))->assertRedirect();
});

test('product-canvas.update: customer denied', function () {
    [$user, $project] = setupProject('customer');
    $canvas = ProductCanvas::where('project_id', $project->id)->first();
    test()->actingAs($user)->patch(route('product-canvas.update', $canvas), [
        'target_audience' => 'todos',
    ])->assertForbidden();
});

test('product-canvas.update: domain_expert allowed', function () {
    [$user, $project] = setupProject('domain_expert');
    $canvas = ProductCanvas::where('project_id', $project->id)->first();
    test()->actingAs($user)->patch(route('product-canvas.update', $canvas), [
        'target_audience' => 'todos',
    ])->assertRedirect();
});

// ===========================
// BOUNDARY: user fora do projeto
// ===========================

test('outsider cannot create any artifact (403)', function () {
    $project = Project::factory()->create();
    $outsider = User::factory()->create();

    test()->actingAs($outsider)->post(route('persona.store'), [
        'name' => 'Hack', 'project_id' => $project->id,
    ])->assertForbidden();

    test()->actingAs($outsider)->post(route('sprint.store'), [
        'name' => 'S', 'start_date' => '2026-05-01', 'end_date' => '2026-05-15',
        'status' => 'active', 'project_id' => $project->id,
    ])->assertForbidden();

    test()->actingAs($outsider)->post(route('change-request.store'), [
        'requester_name' => 'T', 'description' => 'X',
        'request_date' => '2026-04-15', 'project_id' => $project->id,
    ])->assertForbidden();
});
