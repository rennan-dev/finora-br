<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'description' => ['sometimes', 'required', 'string', 'min:1', 'max:255'],
            'amount' => ['sometimes', 'numeric', 'gt:0', 'decimal:0,2'],
            'transaction_date' => ['sometimes', 'date'],
            'payment_method_id' => ['sometimes', 'integer', 'exists:payment_methods,id'],
            'destination_payment_method_id' => ['nullable', 'integer', 'different:payment_method_id', 'exists:payment_methods,id'],
            'invoice_id' => ['nullable', 'integer', 'exists:invoices,id'],
            'invoice_reference_month' => ['nullable', 'integer', 'between:1,12', 'required_with:invoice_reference_year'],
            'invoice_reference_year' => ['nullable', 'integer', 'between:2000,2100', 'required_with:invoice_reference_month'],
        ];
    }
}
