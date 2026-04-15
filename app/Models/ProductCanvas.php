<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductCanvas extends Model
{
  use SoftDeletes;

  protected $fillable = [
    'issues',
    'solutions',
    'personas',
    'restrictions',
    'product_is',
    'product_is_not',
    'project_id',
    'is_ai_generated',
  ];

  protected $table = 'product_canvas';

  public function project()
  {
    return $this->belongsTo(Project::class);
  }
}
