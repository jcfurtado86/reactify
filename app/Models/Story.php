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
    'epic_index',
    'invest_card',
    'value',
    'complexity',
    'is_ai_generated',
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

  public function personas()
  {
    return $this->belongsToMany(Persona::class, 'persona_story')
      ->withTimestamps();
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

  protected static function boot()
  {
    parent::boot();

    // Evento disparado ANTES de salvar (criação ou atualização)
    static::saving(function ($story) {
      // Verifica se o epic_id foi preenchido e se o epic_index ainda está vazio
      // OU se o epic_id mudou (moveu a story de um épico para outro)
      if ($story->epic_id && ($story->isDirty('epic_id') || is_null($story->epic_index))) {

        // Busca o maior índice atual DENTRO deste épico específico
        $maxIndex = Story::where('epic_id', $story->epic_id)
          ->max('epic_index'); // Retorna ex: 5

        // Define o novo índice como o máximo + 1 (ex: 6)
        // Se não houver filhos, max retorna null, então vira 1.
        $story->epic_index = $maxIndex ? $maxIndex + 1 : 1;
      }

      // Opcional: Se remover o epic_id, limpa o index
      if (is_null($story->epic_id)) {
        $story->epic_index = null;
      }
    });

    static::deleted(function ($story) {
      // Se for um Soft Delete, o registro ainda existe,
      // mas queremos soltar os filhos.

      // Verifica se foi apenas um soft delete (não force delete)
      if (!$story->isForceDeleting()) {
        // Atualiza todas as stories que têm esta story como pai (epic_id)
        $story->stories()->update(['epic_id' => null]);
      }

      //
      // Só precisa reordenar se a story tinha um pai (epic_id)
      if ($story->epic_id && !is_null($story->epic_index)) {
        static::reorderEpicIndices($story->epic_id, $story->epic_index);
      }
    });
  }
  protected static function reorderEpicIndices($epicId, $removedIndex)
  {
    Story::where('epic_id', $epicId)
      ->where('epic_index', '>', $removedIndex)
      ->orderBy('epic_index')
      ->chunk(50, function ($stories) { // Chunk para não sobrecarregar memória se tiver muitos
        foreach ($stories as $story) {
          $story->epic_index -= 1;
          // saveQuietly é ESSENCIAL para não disparar o 'saving' de novo
          $story->saveQuietly();
        }
      });
  }
}
