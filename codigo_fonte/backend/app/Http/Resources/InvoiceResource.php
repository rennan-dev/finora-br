<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference_year' => $this->reference_year,
            'reference_month' => $this->reference_month,
            'cycle' => $this->cycle,
            'status' => $this->status,
            'total_amount' => (float) ($this->total_amount ?? 0),
            'paid_at' => $this->paid_at?->toISOString(),
            'payment_method' => new PaymentMethodResource($this->whenLoaded('paymentMethod')),
            'paid_from_payment_method' => new PaymentMethodResource($this->whenLoaded('paidFromPaymentMethod')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
