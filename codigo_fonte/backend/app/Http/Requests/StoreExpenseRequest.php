<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExpenseRequest extends FormRequest
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
            'transaction_date' => ['sometimes', 'date'],
            'type' => ['required', Rule::in(['credit', 'debit', 'deposit', 'transfer', 'boleto'])],
            'payment_method_id' => ['required', 'integer', 'exists:payment_methods,id'],
            'destination_payment_method_id' => [
                'nullable',
                'integer',
                'different:payment_method_id',
                'required_if:type,transfer',
                'exists:payment_methods,id',
            ],
            'invoice_id' => ['nullable', 'integer', 'exists:invoices,id'],
        ];
    }
}
