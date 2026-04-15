<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Persona extends Model
{
  use HasFactory, SoftDeletes;

  protected $fillable = [
    'name',
    'project_id',
    'profile',
    'expectations',
    'invest_card',
    'goals',
    'is_ai_generated',
  ];

  protected $casts = [
    'profile' => 'array',
    'expectations' => 'array',
    'goals' => 'array',
    'invest_card' => 'array',
  ];

  public function project()
  {
    return $this->belongsTo(Project::class);
  }
}
