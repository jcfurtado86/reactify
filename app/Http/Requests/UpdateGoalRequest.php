<?php

namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class UpdateGoalRequest extends FormRequest
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
      'title' => 'nullable|string:max:255',
      'type' => 'nullable|in:cg,bg',
      'priority' => 'nullable|in:low,medium,high',
      'invest_card' => 'nullable|array',
      'invest_card.independent' => 'nullable|string|in:yes,no,na',
      'invest_card.negotiable' => 'nullable|string|in:yes,no,na',
      'invest_card.valuable' => 'nullable|string|in:yes,no,na',
      'invest_card.estimable' => 'nullable|string|in:yes,no,na',
      'invest_card.small' => 'nullable|string|in:yes,no,na',
      'invest_card.testable' => 'nullable|string|in:yes,no,na',
    ];
  }
}
