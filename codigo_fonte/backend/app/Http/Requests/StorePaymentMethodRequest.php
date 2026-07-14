<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'balance' => ['sometimes', 'numeric', 'between:-999999999999.99,999999999999.99'],
            'is_favorite' => ['sometimes', 'boolean'],
        ];
    }
}
