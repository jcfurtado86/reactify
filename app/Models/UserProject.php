<?php

namespace App\Models;

use App\Enums\UserRole as UserRoleEnum;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Log;

class UserProject extends Pivot
{
  protected $table = 'user_project';

  protected $fillable = ['user_id', 'project_id'];

  protected $casts = ['role' => UserRoleEnum::class];

  protected $appends = ['permissions'];

  public function getPermissionsAttribute(): array
  {
    return $this->role
      ? collect($this->role->permissions())
        ->map(fn($p) => $p->value)
        ->all()
      : [];
  }
}
