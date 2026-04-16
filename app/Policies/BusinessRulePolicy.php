<?php

namespace App\Policies;

use App\Enums\PermissionEnum;

class BusinessRulePolicy extends BaseArtifactPolicy
{
    protected PermissionEnum $viewPermission = PermissionEnum::BUSINESS_RULE_VIEW;
    protected PermissionEnum $managePermission = PermissionEnum::BUSINESS_RULE_MANAGE;
}
