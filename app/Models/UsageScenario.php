<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UsageScenario extends Model
{
  use HasFactory;

  /**
   * The attributes that are mass assignable.
   *
   * @var array<int, string>
   */
  protected $fillable = [
    'story_id',
    'project_id',
    'description',
    'invest_card',
  ];
  /**
   * The attributes that should be cast.
   *
   * @var array<string, string>
   */
  protected $casts = [
    'description' => 'array',
    'invest_card' => 'array',
  ];

  /**
   * Get the story that owns the usage scenario.
   */
  public function story()
  {
    return $this->belongsTo(Story::class);
  }

  public function project()
  {
    return $this->belongsTo(Project::class);
  }
}
