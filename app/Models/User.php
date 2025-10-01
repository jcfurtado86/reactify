<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable implements MustVerifyEmail
{
  /** @use HasFactory<\Database\Factories\UserFactory> */
  use HasFactory, Notifiable, SoftDeletes;

  /**
   * The attributes that are mass assignable.
   *
   * @var list<string>
   */
  protected $fillable = [
    'name',
    'email',
    'password',
    'active',
    'provider_id',
    'provider_name',
    'provider_avatar',
    'email_verified_at',
  ];

  /**
   * The attributes that should be hidden for serialization.
   *
   * @var list<string>
   */
  protected $hidden = ['password', 'remember_token'];

  /**
   * Get the attributes that should be cast.
   *
   * @return array<string, string>
   */
  protected function casts(): array
  {
    return [
      'email_verified_at' => 'datetime',
      'password' => 'hashed',
    ];
  }

  public function projects(): BelongsToMany
  {
    return $this->belongsToMany(Project::class, 'user_project')
      ->withPivot('role')
      ->withTimestamps();
  }

  public function invitations(): HasMany
  {
    return $this->hasMany(ProjectInvitation::class, 'inviter_id');
  }

  public function changeRequests()
  {
    return $this->hasMany(ChangeRequest::class, 'requested_by_id');
  }
}
