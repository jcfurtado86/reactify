<?php

namespace App\Models;

use App\Enums\ChangeRequestStatus;
use App\Enums\StoryImpactType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChangeRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        // 'requested_by_id',
        'requester_name',
        'description',
        'status',
        // 'effort',
        'request_date',
    ];

    protected $casts = [
        'status' => ChangeRequestStatus::class,
        'request_date' => 'date',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by_id');
    }

    public function stories()
    {
        return $this->belongsToMany(Story::class, 'change_request_story')
            ->withPivot('impact_type')
            ->withTimestamps();
    }

    public function impactedStories()
    {
        return $this->stories()->wherePivot('impact_type', StoryImpactType::IMPACTADA);
    }

    public function newStories()
    {
        return $this->stories()->wherePivot('impact_type', StoryImpactType::NOVA);
    }
}

