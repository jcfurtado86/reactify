<?php

namespace App\Policies;

use App\Enums\PermissionEnum;

class UsageScenarioPolicy extends BaseArtifactPolicy
{
    protected PermissionEnum $viewPermission = PermissionEnum::USAGE_SCENARIO_VIEW;
    protected PermissionEnum $managePermission = PermissionEnum::USAGE_SCENARIO_MANAGE;
}
