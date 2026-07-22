<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRecurringExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'description' => ['required', 'string', 'min:1', 'max:255'],
            'amount' => ['required', 'numeric', 'gt:0', 'decimal:0,2'],
            'payment_method_id' => ['required', 'integer', 'exists:payment_methods,id'],
        ];
    }
}