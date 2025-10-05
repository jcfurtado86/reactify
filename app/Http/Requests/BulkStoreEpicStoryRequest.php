<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkStoreEpicStoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'epic_stories' => 'required|array',
            'epic_stories.*.title' => 'required|string|max:255',
            'epic_stories.*.story_id' => 'required|exists:stories,id',
            'epic_stories.*.project_id' => 'required|exists:projects,id',
        ];
    }
}