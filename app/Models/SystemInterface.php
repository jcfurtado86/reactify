<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SystemInterface extends Model
{
  protected $fillable = [
    'title',
    'input',
    'output',
    'type',
    'project_id',
    'is_ai_generated',
  ];

  protected $casts = [];

  protected $appends = ['overall_model_class_ids'];

  public function overallModelClasses(): BelongsToMany
  {
    return $this->belongsToMany(
      OverallModelClass::class,
      'overall_model_class_system_interface'
    )->using(OverallClassSystemInterfacePivot::class);
  }

  public function project()
  {
    return $this->belongsTo(Project::class);
  }

  public function getOverallModelClassIdsAttribute()
  {
    return $this->overallModelClasses()->pluck('id');
  }
}
