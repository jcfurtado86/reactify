<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemColor extends Model
{
  protected $fillable = ['project_id', 'stories', 'goals'];

  protected $casts = [
    'stories' => 'array',
    'goals' => 'array',
  ];

  public function project()
  {
    return $this->belongsTo(Project::class);
  }
}
