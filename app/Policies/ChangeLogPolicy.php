<?php

namespace App\Policies;

use App\Enums\PermissionEnum;

class ChangeLogPolicy extends BaseArtifactPolicy
{
    protected PermissionEnum $viewPermission = PermissionEnum::CHANGE_LOG_VIEW;
    protected PermissionEnum $managePermission = PermissionEnum::CHANGE_LOG_MANAGE;
}
