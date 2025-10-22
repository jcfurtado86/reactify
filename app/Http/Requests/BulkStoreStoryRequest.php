<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkStoreStoryRequest extends FormRequest
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
      'stories' => 'required|array|max:50',
      'stories.*' => 'required',
      'stories.*.title' => 'required|string',
      'stories.*.type' => 'required|in:user,system',
      'stories.*.project_id' => 'required|exists:projects,id',
      'stories.*.epic_id' => 'required|exists:stories,id'
    ];
  }
}
