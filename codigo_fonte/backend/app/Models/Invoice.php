<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_method_id',
        'reference_year',
        'reference_month',
        'cycle',
        'status',
        'paid_at',
        'paid_from_payment_method_id',
        'payment_expense_id',
    ];

    protected function casts(): array
    {
        return [
            'reference_year' => 'integer',
            'reference_month' => 'integer',
            'cycle' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function paidFromPaymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'paid_from_payment_method_id');
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }
}
