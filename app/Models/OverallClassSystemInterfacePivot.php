<?php

namespace App\Models;

use App\Models\SystemInterface;
use App\Events\ProjectUpdated;
use Illuminate\Database\Eloquent\Relations\Pivot;

class OverallClassSystemInterfacePivot extends Pivot
{
  protected $fillable = [
    'overall_model_class_id',
    'system_interface_id',
  ];

  protected static function booted()
  {
    static::created(function ($pivot) {
      $systemInterface = SystemInterface::find($pivot->system_interface_id);

      if ($systemInterface) {
        $project = $systemInterface->project;
        broadcast(new ProjectUpdated($project));
      }
    });
    static::updated(function ($pivot) {
      $systemInterface = SystemInterface::find($pivot->system_interface_id);

      if ($systemInterface) {
        $project = $systemInterface->project;
        broadcast(new ProjectUpdated($project));
      }
    });
    static::deleted(function ($pivot) {
      $systemInterface = SystemInterface::find($pivot->system_interface_id);

      if ($systemInterface) {
        $project = $systemInterface->project;
        broadcast(new ProjectUpdated($project));
      }
    });
  }
}
