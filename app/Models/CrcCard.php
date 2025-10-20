<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CrcCard extends Model
{
  use HasFactory;

  protected $fillable = [
    'class',
    'collaborators',
    'responsabilities',
    'project_id',
    'invest_card',
  ];

  protected $casts = [
    'collaborators' => 'array',
    'responsabilities' => 'array',
    'invest_card' => 'array',
  ];

  public function project(): BelongsTo
  {
    return $this->belongsTo(Project::class);
  }
}
