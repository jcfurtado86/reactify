<?php

namespace App\Policies;

use App\Enums\PermissionEnum;

class OverallModelPolicy extends BaseArtifactPolicy
{
    protected PermissionEnum $viewPermission = PermissionEnum::OVERALL_MODEL_VIEW;
    protected PermissionEnum $managePermission = PermissionEnum::OVERALL_MODEL_MANAGE;
}
