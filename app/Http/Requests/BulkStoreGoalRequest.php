<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkStoreGoalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'goals' => 'required|array',
            'goals.*.title' => 'required|string|max:255',
            'goals.*.type' => 'required|in:bg,cg',
            'goals.*.priority' => 'required|in:low,medium,high',
            'goals.*.project_id' => 'required|exists:projects,id',
        ];
    }
}