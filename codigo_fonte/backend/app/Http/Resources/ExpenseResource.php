<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'description' => $this->description,
            'amount' => (float) $this->amount,
            'transaction_date' => $this->transaction_date?->toDateString(),
            'type' => $this->type,
            'is_paid' => $this->is_paid ?? false,
            'payment_method_id' => $this->payment_method_id,
            'destination_payment_method_id' => $this->destination_payment_method_id,
            'invoice_id' => $this->invoice_id,
            'payment_method' => new PaymentMethodResource($this->whenLoaded('paymentMethod')),
            'destination_payment_method' => new PaymentMethodResource($this->whenLoaded('destinationPaymentMethod')),
            'invoice' => new InvoiceResource($this->whenLoaded('invoice')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
