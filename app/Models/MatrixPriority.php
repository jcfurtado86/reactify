<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MatrixPriority extends Model
{
  protected $fillable = ['name', 'color', 'project_id', 'order_column'];

  public function prioritizations()
  {
    // Adicionado 'priority_id' como chave estrangeira
    return $this->hasMany(Prioritization::class, 'priority_id');
  }

  public function project()
  {
    return $this->belongsTo(Project::class);
  }
}
