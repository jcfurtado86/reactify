<?php

namespace App\Policies;

use App\Enums\PermissionEnum;

class SystemInterfacePolicy extends BaseArtifactPolicy
{
    protected PermissionEnum $viewPermission = PermissionEnum::INTERFACE_VIEW;
    protected PermissionEnum $managePermission = PermissionEnum::INTERFACE_MANAGE;
}
