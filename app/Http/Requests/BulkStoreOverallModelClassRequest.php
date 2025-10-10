<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkStoreOverallModelClassRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'classes' => 'required|array',
            'classes.*.name' => 'required|string|max:255',
            'classes.*.project_id' => 'required|exists:projects,id',
        ];
    }
}