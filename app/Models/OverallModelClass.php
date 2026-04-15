<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class OverallModelClass extends Model
{
  protected $fillable = [
    'name',
    'project_id',
    'is_ai_generated',
  ];

  public function system_interfaces(): BelongsToMany
  {
    return $this->belongsToMany(SystemInterface::class, 'overall_model_class_system_interface');
  }

  public function project()
  {
    return $this->belongsTo(Project::class);
  }
}
