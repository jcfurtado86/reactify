<?php

namespace App\Policies;

use App\Enums\PermissionEnum;

class StoryboardPolicy extends BaseArtifactPolicy
{
    protected PermissionEnum $viewPermission = PermissionEnum::STORYBOARD_VIEW;
    protected PermissionEnum $managePermission = PermissionEnum::STORYBOARD_MANAGE;
}
