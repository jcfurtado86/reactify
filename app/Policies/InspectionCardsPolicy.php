<?php

namespace App\Policies;

use App\Enums\PermissionEnum;

class InspectionCardsPolicy extends BaseArtifactPolicy
{
    protected PermissionEnum $viewPermission = PermissionEnum::INSPECTION_CARDS_VIEW;
    protected PermissionEnum $managePermission = PermissionEnum::INSPECTION_CARDS_MANAGE;
}
