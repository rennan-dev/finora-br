<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRecurringExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'description' => ['sometimes', 'string', 'min:1', 'max:255'],
            'amount' => ['sometimes', 'numeric', 'gt:0', 'decimal:0,2'],
            'payment_method_id' => ['sometimes', 'integer', 'exists:payment_methods,id'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}