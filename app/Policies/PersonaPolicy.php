<?php

namespace App\Policies;

use App\Enums\PermissionEnum;

class PersonaPolicy extends BaseArtifactPolicy
{
    protected PermissionEnum $viewPermission = PermissionEnum::PERSONA_VIEW;
    protected PermissionEnum $managePermission = PermissionEnum::PERSONA_MANAGE;
}
