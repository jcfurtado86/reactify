<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Contracts\Translation\HasLocalePreference;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable implements MustVerifyEmail, HasLocalePreference
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
    'avatar_path',
    'email_verified_at',
    'locale',
  ];

  public function preferredLocale(): string
  {
    return $this->locale ?: config('app.locale');
  }

  /**
   * The attributes that should be hidden for serialization.
   *
   * @var list<string>
   */

  protected $appends = ['avatar_url'];
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
      ->using(UserProject::class)
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

  protected function avatarUrl(): Attribute
  {
    return Attribute::make(
      get: function () {
        if ($this->avatar_path) {
          return Storage::url($this->avatar_path);
        }

        if ($this->provider_avatar) {
          return $this->provider_avatar;
        }
        return  'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&color=7F9CF5&background=EBF4FF';
      }
    );
  }
}
