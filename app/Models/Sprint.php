<?php
// app/Models/Sprint.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sprint extends Model
{
  use HasFactory, SoftDeletes;

  protected $table = 'sprints';

  protected $fillable = [
    'name',
    'start_date',
    'end_date',
    'status',
    'project_id',
    'user_id',
  ];

  protected $casts = [
    'start_date' => 'string',
    'end_date' => 'string',
  ];

  public function user()
  {
    return $this->belongsTo(User::class);
  }

  // Relacionamento many-to-many com Stories
  public function stories()
  {
    return $this->belongsToMany(Story::class, 'story_sprint')
      ->withPivot('kanban_status', 'position')
      ->withTimestamps();
  }

  public function project()
  {
    return $this->belongsTo(Project::class);
  }

  // Scope para sprints ativas
  public function scopeActive($query)
  {
    return $query->where('status', 'active');
  }

  // Scope para sprints em planejamento
  public function scopePlanning($query)
  {
    return $query->where('status', 'planning');
  }
}
