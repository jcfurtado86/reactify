<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkStoreUsageScenarioRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'usage_scenarios' => 'required|array',
            'usage_scenarios.*.description' => 'required|array',
            'usage_scenarios.*.description.as' => 'required|string',
            'usage_scenarios.*.description.given' => 'required|string',
            'usage_scenarios.*.description.when' => 'required|string',
            'usage_scenarios.*.description.then_1' => 'required|string',
            'usage_scenarios.*.description.and' => 'nullable|string',
            'usage_scenarios.*.description.then_2' => 'nullable|string',
            'usage_scenarios.*.story_id' => 'required|exists:stories,id',
            'usage_scenarios.*.project_id' => 'required|exists:projects,id',
        ];
    }
}