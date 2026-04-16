<?php

namespace App\Support;

use App\Enums\PermissionEnum;
use App\Enums\UserRole;
use App\Models\Project;
use App\Models\User;

// Centraliza a resolução de papéis e permissões por projeto.
// Permissões do REACT-M são escopadas por user_project.role, não globais.
// Policies e helpers do frontend passam por aqui.
class ProjectAccess
{
    public static function roleFor(?User $user, ?Project $project): ?UserRole
    {
        if (!$user || !$project) {
            return null;
        }

        $pivotRow = $user->projects()
            ->where('projects.id', $project->id)
            ->first();

        $roleValue = $pivotRow?->pivot?->role;
        if (!$roleValue) {
            return null;
        }

        return is_string($roleValue) ? UserRole::tryFrom($roleValue) : $roleValue;
    }

    public static function can(?User $user, ?Project $project, PermissionEnum $permission): bool
    {
        $role = self::roleFor($user, $project);
        if (!$role) {
            return false;
        }
        return $role->hasPermission($permission);
    }

    public static function permissionsFor(?User $user, ?Project $project): array
    {
        $role = self::roleFor($user, $project);
        if (!$role) {
            return [];
        }
        return array_map(fn (PermissionEnum $p) => $p->value, $role->permissions());
    }
}
