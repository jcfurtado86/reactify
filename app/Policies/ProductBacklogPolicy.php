<?php

namespace App\Policies;

use App\Enums\PermissionEnum;

class ProductBacklogPolicy extends BaseArtifactPolicy
{
    protected PermissionEnum $viewPermission = PermissionEnum::PRODUCT_BACKLOG_VIEW;
    protected PermissionEnum $managePermission = PermissionEnum::PRODUCT_BACKLOG_MANAGE;
}
