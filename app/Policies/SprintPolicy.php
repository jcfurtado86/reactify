<?php

namespace App\Policies;

use App\Enums\PermissionEnum;

class SprintPolicy extends BaseArtifactPolicy
{
    protected PermissionEnum $viewPermission = PermissionEnum::SPRINT_VIEW;
    protected PermissionEnum $managePermission = PermissionEnum::SPRINT_MANAGE;
}
