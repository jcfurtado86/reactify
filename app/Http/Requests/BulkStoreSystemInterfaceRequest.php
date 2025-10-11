<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkStoreSystemInterfaceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'system_interfaces' => 'required|array',
            'system_interfaces.*.title' => 'required|string|max:255',
            'system_interfaces.*.input' => 'required|string|max:255',
            'system_interfaces.*.output' => 'required|string|max:255',
            'system_interfaces.*.type' => 'required|string|in:internal,external',
            'system_interfaces.*.project_id' => 'required|integer|exists:projects,id',
            'system_interfaces.*.overall_model_class_ids' => 'nullable|array',
            'system_interfaces.*.overall_model_class_ids.*' => 'integer|exists:overall_model_classes,id'
        ];
    }
}