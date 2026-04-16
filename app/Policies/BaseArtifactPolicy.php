<?php

namespace App\Policies;

use App\Enums\PermissionEnum;
use App\Models\Project;
use App\Models\User;
use App\Support\ProjectAccess;

// Base para policies de artefatos. Subclasses declaram $viewPermission,
// $managePermission e (opcional) overridem resolveProject($model) se o
// model não tiver $model->project_id direto.
//
// A assinatura de create() recebe Project pra evitar ter que instanciar
// um modelo vazio antes de autorizar. Controllers passam o Project explícito.
abstract class BaseArtifactPolicy
{
    protected PermissionEnum $viewPermission;
    protected PermissionEnum $managePermission;

    public function view(User $user, $model): bool
    {
        return ProjectAccess::can($user, $this->resolveProject($model), $this->viewPermission);
    }

    public function update(User $user, $model): bool
    {
        return ProjectAccess::can($user, $this->resolveProject($model), $this->managePermission);
    }

    public function delete(User $user, $model): bool
    {
        return ProjectAccess::can($user, $this->resolveProject($model), $this->managePermission);
    }

    public function create(User $user, Project $project): bool
    {
        return ProjectAccess::can($user, $project, $this->managePermission);
    }

    public function viewAny(User $user, Project $project): bool
    {
        return ProjectAccess::can($user, $project, $this->viewPermission);
    }

    protected function resolveProject($model): ?Project
    {
        if ($model instanceof Project) {
            return $model;
        }
        if (isset($model->project) && $model->project instanceof Project) {
            return $model->project;
        }
        if (isset($model->project_id)) {
            return Project::find($model->project_id);
        }
        return null;
    }
}
