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
    'is_ai_generated',
  ];

  protected $casts = [
    'collaborators' => 'array',
    'responsabilities' => 'array',
  ];

  public function project(): BelongsTo
  {
    return $this->belongsTo(Project::class);
  }
}
