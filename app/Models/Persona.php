<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Persona extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'project_id',
        'profile',
        'expectations',
        'goals'
    ];

    protected $casts = [
        'profile' => 'array',
        'expectations' => 'array',
        'goals' => 'array'
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
