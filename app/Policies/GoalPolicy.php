<?php

namespace App\Policies;

use App\Enums\PermissionEnum;

class GoalPolicy extends BaseArtifactPolicy
{
    protected PermissionEnum $viewPermission = PermissionEnum::GOAL_VIEW;
    protected PermissionEnum $managePermission = PermissionEnum::GOAL_MANAGE;
}
