<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Journey extends Model
{
  use SoftDeletes;

  protected $fillable = ['title', 'steps', 'project_id', 'invest_card'];

  protected $casts = [
    'steps' => 'array',
    'invest_card' => 'array',
  ];

  public function project()
  {
    return $this->belongsTo(Project::class);
  }

  // Método para adicionar steps
  public function addSteps(array $steps)
  {
    $this->steps = $steps;
    $this->save();
  }
}
