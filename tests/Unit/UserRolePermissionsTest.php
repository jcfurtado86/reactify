<?php

use App\Enums\PermissionEnum;
use App\Enums\UserRole;

// Contrato das permissões por papel, seguindo REACT-M (p.83-115 da dissertação).
// Cada fechadura do PermissionEnum aparece aqui com o set de papéis humanos que
// devem receber MANAGE ou VIEW. Administrator é checado separadamente (tudo liberado).
//
// Se a matriz abaixo divergir de UserRole::permissions(), o teste quebra. Ele é
// o contrato — mudou metodologia? atualiza AQUI e só depois o enum.

const REACT_M_MATRIX = [
    // artefato => [ 'view' => [roles com view], 'manage' => [roles com manage] ]
    'persona' => [
        'view'   => ['customer', 'domain_expert', 'team'],
        'manage' => ['domain_expert', 'team'],
    ],
    'goal' => [
        'view'   => ['customer', 'domain_expert', 'team'],
        'manage' => ['domain_expert'],
    ],
    'journey' => [
        'view'   => ['customer', 'domain_expert', 'team'],
        'manage' => ['domain_expert'],
    ],
    'productCanvas' => [
        'view'   => ['customer', 'domain_expert', 'team'],
        'manage' => ['domain_expert'],
    ],
    'userStory' => [
        'view'   => ['customer', 'domain_expert', 'team'],
        'manage' => ['domain_expert', 'team'],
    ],
    'businessRule' => [
        'view'   => ['customer', 'domain_expert', 'team'],
        'manage' => ['domain_expert', 'team'],
    ],
    'usageScenario' => [
        'view'   => ['customer', 'domain_expert', 'team'],
        'manage' => ['domain_expert', 'team'],
    ],
    'overallModel' => [
        'view'   => ['customer', 'domain_expert', 'team'],
        'manage' => ['team'],
    ],
    'interface' => [
        'view'   => ['customer', 'domain_expert', 'team'],
        'manage' => ['team'],
    ],
    'storyboard' => [
        'view'   => ['customer', 'domain_expert', 'team'],
        'manage' => ['team'],
    ],
    'prioritizationMatrix' => [
        'view'   => ['customer', 'domain_expert', 'team'],
        'manage' => ['customer', 'domain_expert', 'team'],
    ],
    'changeLog' => [
        'view'   => ['customer', 'domain_expert', 'team'],
        'manage' => ['customer', 'domain_expert', 'team'],
    ],
    'productBacklog' => [
        'view'   => ['customer', 'domain_expert', 'team'],
        'manage' => ['domain_expert'],
    ],
    'sprint' => [
        'view'   => ['customer', 'domain_expert', 'team'],
        'manage' => ['team'],
    ],
    'inspectionCards' => [
        'view'   => ['customer', 'domain_expert', 'team'],
        'manage' => ['team'],
    ],
];

function roleFromString(string $value): UserRole
{
    return UserRole::from($value);
}

function permissionFor(string $artifact, string $action): PermissionEnum
{
    $value = $artifact . '.' . $action;
    foreach (PermissionEnum::cases() as $case) {
        if ($case->value === $value) {
            return $case;
        }
    }
    throw new RuntimeException("PermissionEnum não tem '{$value}'");
}

test('FACILITATOR foi removido do UserRole', function () {
    $values = array_map(fn ($c) => $c->value, UserRole::cases());
    expect($values)->not->toContain('facilitator');
    expect($values)->toMatchArray(['customer', 'domain_expert', 'team', 'administrator']);
});

test('SYSTEM_STORY foi removido do PermissionEnum', function () {
    $values = array_map(fn ($c) => $c->value, PermissionEnum::cases());
    expect($values)->not->toContain('systemStory.view');
    expect($values)->not->toContain('systemStory.manage');
});

test('ADMINISTRATOR tem todas as permissões', function () {
    foreach (PermissionEnum::cases() as $perm) {
        expect(UserRole::ADMINISTRATOR->hasPermission($perm))
            ->toBeTrue("ADMINISTRATOR deveria ter {$perm->value}");
    }
});

test('matriz de papéis REACT-M bate com UserRole::permissions()', function () {
    foreach (REACT_M_MATRIX as $artifact => $rules) {
        foreach (['view', 'manage'] as $action) {
            $perm = permissionFor($artifact, $action);
            $rolesWithAccess = $rules[$action];

            foreach (['customer', 'domain_expert', 'team'] as $roleValue) {
                $role = roleFromString($roleValue);
                $shouldHave = in_array($roleValue, $rolesWithAccess, true);
                $has = $role->hasPermission($perm);

                $msg = "{$role->value} " . ($shouldHave ? 'deveria ter' : 'NÃO deveria ter') . " {$perm->value}";
                expect($has)->toBe($shouldHave, $msg);
            }
        }
    }
});

test('todo PermissionEnum está coberto pela matriz REACT-M', function () {
    // Defesa contra adicionar slot novo no PermissionEnum sem atualizar o contrato.
    $covered = [];
    foreach (REACT_M_MATRIX as $artifact => $rules) {
        $covered[] = $artifact . '.view';
        $covered[] = $artifact . '.manage';
    }
    sort($covered);

    $declared = array_map(fn ($c) => $c->value, PermissionEnum::cases());
    sort($declared);

    $missing = array_diff($declared, $covered);
    expect($missing)->toBe([], 'Slots no PermissionEnum fora da matriz REACT-M: ' . implode(', ', $missing));

    $extra = array_diff($covered, $declared);
    expect($extra)->toBe([], 'Slots na matriz REACT-M que não existem no PermissionEnum: ' . implode(', ', $extra));
});
