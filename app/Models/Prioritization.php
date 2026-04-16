<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prioritization extends Model
{
  protected $fillable = ['story_id', 'project_id', 'position', 'priority_id', 'goal_id'];

  public function project()
  {
    return $this->belongsTo(Project::class);
  }

  public function matrixPriority()
  {
    // Adicionado 'priority_id' como chave estrangeira
    return $this->belongsTo(MatrixPriority::class, 'priority_id');
  }
  /**
     * Relacionamento com a Estória.
     * Permite acessar $prioritization->story->title
     */
  public function story()
  {
      return $this->belongsTo(Story::class);
  }

  public function goal()
  {
      return $this->belongsTo(Goal::class);
  }
}
