<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkStoreBusinessRuleRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'business_rules' => 'required|array',
            'business_rules.*.title' => 'required|string|max:255',
            'business_rules.*.story_id' => 'required|exists:stories,id',
            'business_rules.*.project_id' => 'required|exists:projects,id',
        ];
    }
}