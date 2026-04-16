<?php

namespace App\Policies;

use App\Enums\PermissionEnum;

class PrioritizationMatrixPolicy extends BaseArtifactPolicy
{
    protected PermissionEnum $viewPermission = PermissionEnum::PRIORITIZATION_MATRIX_VIEW;
    protected PermissionEnum $managePermission = PermissionEnum::PRIORITIZATION_MATRIX_MANAGE;
}
