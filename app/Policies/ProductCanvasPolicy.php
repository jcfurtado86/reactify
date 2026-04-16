<?php

namespace App\Policies;

use App\Enums\PermissionEnum;

class ProductCanvasPolicy extends BaseArtifactPolicy
{
    protected PermissionEnum $viewPermission = PermissionEnum::PRODUCT_CANVAS_VIEW;
    protected PermissionEnum $managePermission = PermissionEnum::PRODUCT_CANVAS_MANAGE;
}
