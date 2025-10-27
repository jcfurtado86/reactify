<?php

namespace App\Models;

use App\Enums\ProjectStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
  use HasFactory, SoftDeletes;

  protected $fillable = ['title', 'description', 'status', 'due_date'];

  protected $table = 'projects';

  protected $casts = [
    'active' => 'boolean',
    'status' => ProjectStatus::class,
    'due_date' => 'date',
  ];

  public function journeys(): HasMany
  {
    return $this->hasMany(Journey::class);
  }

  public function system_colors(): HasOne
  {
    return $this->hasOne(SystemColor::class);
  }

  public function product_canvas(): HasOne
  {
    return $this->hasOne(ProductCanvas::class);
  }

  public function personas(): HasMany
  {
    return $this->hasMany(Persona::class);
  }

  public function goal_sketches(): HasMany
  {
    return $this->hasMany(Goal::class);
  }

  public function stories(): HasMany
  {
    return $this->hasMany(Story::class);
  }

  public function storyboards(): HasMany
  {
    return $this->hasMany(Storyboard::class);
  }

  public function interviews(): HasMany
  {
    return $this->hasMany(Interview::class);
  }

  public function business_rules(): HasMany
  {
    return $this->hasMany(BusinessRule::class);
  }

  public function usage_scenarios(): HasMany
  {
    return $this->hasMany(UsageScenario::class);
  }

  public function invitations(): HasMany
  {
    return $this->hasMany(ProjectInvitation::class);
  }

  public function users(): BelongsToMany
  {
    return $this->belongsToMany(User::class, 'user_project')
      ->using(UserProject::class)
      ->withPivot('role')
      ->withTimestamps();
  }

  public function crc_cards(): HasMany
  {
    return $this->hasMany(CrcCard::class);
  }
  public function overall_model_classes(): HasMany
  {
    return $this->hasMany(OverallModelClass::class);
  }
  public function prioritizations(): HasMany
  {
    return $this->hasMany(Prioritization::class);
  }
  public function matrix_priorities(): HasMany
  {
    return $this->hasMany(MatrixPriority::class);
  }
  public function sprints(): HasMany
  {
    return $this->hasMany(Sprint::class);
  }

  public function change_requests(): HasMany
  {
    return $this->hasMany(ChangeRequest::class);
  }

  public function system_interfaces(): HasMany
  {
    return $this->hasMany(SystemInterface::class);
  }
}
