<?php

namespace App\Models;

use App\Enums\StoryBacklogStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Story extends Model
{
  use SoftDeletes;

  protected $fillable = [
    'id',
    'title',
    'type',
    'project_id',
    'epic_id',
    'invest_card',
    'value',
    'complexity',
  ];

  protected $casts = [
    'invest_card' => 'array',
  ];

  public function project()
  {
    return $this->belongsTo(Project::class);
  }
  public function storyboards()
  {
    return $this->hasMany(Storyboard::class);
  }
  public function epicStories()
  {
    return $this->hasMany(EpicStory::class);
  }

  public function businessRules()
  {
    return $this->hasMany(BusinessRule::class);
  }
  public function sprints()
  {
    return $this->belongsToMany(Sprint::class, 'story_sprint')
      ->withPivot(['kanban_status', 'position'])
      ->withTimestamps();
  }

  public function currentSprint()
  {
    return $this->sprints()->where('status', 'active')->first();
  }

  public function usageScenarios()
  {
    return $this->hasMany(UsageScenario::class);
  }

  public function changeRequests()
  {
    return $this->belongsToMany(ChangeRequest::class, 'change_request_story')
      ->withPivot('impact_type')
      ->withTimestamps();
  }

  /**
   * Get the parent story (the epic).
   */

  /**
   * Get the child stories.
   */
}
