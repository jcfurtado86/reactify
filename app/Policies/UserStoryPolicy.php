<?php

namespace App\Policies;

use App\Enums\PermissionEnum;

class UserStoryPolicy extends BaseArtifactPolicy
{
    protected PermissionEnum $viewPermission = PermissionEnum::USER_STORY_VIEW;
    protected PermissionEnum $managePermission = PermissionEnum::USER_STORY_MANAGE;
}
