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

  protected static function boot()
  {
    parent::boot();

    static::deleted(function ($story) {
      // Se for um Soft Delete, o registro ainda existe,
      // mas queremos soltar os filhos.

      // Verifica se foi apenas um soft delete (não force delete)
      if (!$story->isForceDeleting()) {
        // Atualiza todas as stories que têm esta story como pai (epic_id)
        $story->stories()->update(['epic_id' => null]);
      }
    });
  }

  // Relacionamento para isso funcionar
  public function stories()
  {
    return $this->hasMany(Story::class, 'epic_id');
  }

  /**
     * Relacionamento com a Priorização (se houver).
     */
  public function prioritization()
  {
      return $this->hasOne(Prioritization::class);
  }
}
