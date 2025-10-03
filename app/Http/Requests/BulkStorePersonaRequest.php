<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkStorePersonaRequest extends FormRequest
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
            'personas' => 'required|array',
            'personas.*.name' => 'required|string|max:255',
            'personas.*.profile' => 'required|array',
            'personas.*.expectations' => 'required|array',
            'personas.*.goals' => 'required|array',
            'personas.*.project_id' => 'required|exists:projects,id',
        ];
    }
}