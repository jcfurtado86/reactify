<?php

namespace App\Models;

use App\Enums\UserRole as EnumsUserRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserRole extends Model
{
  use SoftDeletes;

  public $timestamps = false;

  protected $fillable = [
    'name',
    'user_role_id',
    'can_create',
    'can_read',
    'can_update'
  ];
  protected $casts = [
    'name' => EnumsUserRole::class,
  ];

  // Relação: Uma role pertence a vários usuários
  public function users(): HasMany
  {
    return $this->hasMany(User::class, 'user_role_id');
  }
}
