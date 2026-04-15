<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductCanvasRequest extends FormRequest
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
      'issues' => 'nullable|string',
      'solutions' => 'nullable|string',
      'personas' => 'nullable|string',
      'restrictions' => 'nullable|string',
      'product_is' => 'nullable|string',
      'product_is_not' => 'nullable|string',
      'is_ai_generated' => 'nullable|boolean',
    ];
  }
}
