<?php

namespace App\Policies;

use App\Enums\PermissionEnum;

class JourneyPolicy extends BaseArtifactPolicy
{
    protected PermissionEnum $viewPermission = PermissionEnum::JOURNEY_VIEW;
    protected PermissionEnum $managePermission = PermissionEnum::JOURNEY_MANAGE;
}
