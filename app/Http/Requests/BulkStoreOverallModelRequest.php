<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkStoreOverallModelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'crc_cards' => 'required|array',
            'crc_cards.*.class' => 'required|string|max:90',
            'crc_cards.*.responsabilities' => 'required|array',
            'crc_cards.*.collaborators' => 'required|array',
            'crc_cards.*.project_id' => 'required|exists:projects,id',
        ];
    }
}
