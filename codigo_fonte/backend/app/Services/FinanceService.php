<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\Invoice;
use App\Models\PaymentMethod;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FinanceService
{
    public function createPaymentMethod(User $user, array $data): PaymentMethod
    {
        return DB::transaction(function () use ($user, $data): PaymentMethod {
            if (($data['is_favorite'] ?? false) === true) {
                $user->paymentMethods()->update(['is_favorite' => false]);
            }

            return $user->paymentMethods()->create([
                'name' => $data['name'],
                'balance' => $data['balance'] ?? 0,
                'is_favorite' => $data['is_favorite'] ?? false,
            ]);
        });
    }

    public function updatePaymentMethod(User $user, PaymentMethod $method, array $data): PaymentMethod
    {
        return DB::transaction(function () use ($user, $method, $data): PaymentMethod {
            $method = PaymentMethod::query()
                ->whereKey($method->id)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (($data['is_favorite'] ?? false) === true) {
                $user->paymentMethods()->where('id', '!=', $method->id)->update(['is_favorite' => false]);
            }

            $method->fill($data);
            $method->save();

            return $method->refresh();
        });
    }

    public function deactivatePaymentMethod(User $user, PaymentMethod $method): void
    {
        DB::transaction(function () use ($user, $method): void {
            $method = PaymentMethod::query()
                ->whereKey($method->id)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            $method->update([
                'is_active' => false,
                'is_favorite' => false,
            ]);
        });
    }

    public function createExpense(User $user, array $data): Expense
    {
        return DB::transaction(function () use ($user, $data): Expense {
            $type = $data['type'];
            $method = $this->lockedMethod($user, $data['payment_method_id']);
            $destinationMethod = isset($data['destination_payment_method_id'])
                ? $this->lockedMethod($user, $data['destination_payment_method_id'])
                : null;

            $this->assertMethodCompatibility($type, $method, $destinationMethod);
            $date = Carbon::parse($data['transaction_date'] ?? now()->toDateString())->startOfDay();
            $invoice = $type === 'credit'
                ? $this->resolveInvoice($user, $method, $date, $data['invoice_id'] ?? null)
                : null;

            $expense = $user->expenses()->create([
                'payment_method_id' => $method->id,
                'destination_payment_method_id' => $destinationMethod?->id,
                'invoice_id' => $invoice?->id,
                'description' => $data['description'],
                'amount' => $data['amount'],
                'transaction_date' => $date->toDateString(),
                'type' => $type,
            ]);

            $this->applyBalanceEffect($expense, 1);

            $expense->load(['paymentMethod', 'destinationPaymentMethod', 'invoice.paymentMethod']);
            $expense->invoice?->loadSum(
                ['expenses as total_amount' => fn ($query) => $query->where('type', 'credit')],
                'amount'
            );

            return $expense;
        });
    }

    public function updateExpense(User $user, Expense $expense, array $data): Expense
    {
        return DB::transaction(function () use ($user, $expense, $data): Expense {
            $expense = Expense::query()
                ->whereKey($expense->id)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($expense->type === 'invoice_payment') {
                $this->validationError('expense', 'O pagamento de uma fatura não pode ser editado.');
            }

            if ($expense->type === 'credit' && $expense->invoice?->status === 'paid') {
                $this->validationError('expense', 'Não é possível editar uma compra de fatura já paga.');
            }

            $this->applyBalanceEffect($expense, -1);

            $method = $this->lockedMethod($user, $data['payment_method_id'] ?? $expense->payment_method_id);
            $destinationId = array_key_exists('destination_payment_method_id', $data)
                ? $data['destination_payment_method_id']
                : $expense->destination_payment_method_id;
            $destinationMethod = $destinationId ? $this->lockedMethod($user, $destinationId) : null;
            $this->assertMethodCompatibility($expense->type, $method, $destinationMethod);

            $date = Carbon::parse($data['transaction_date'] ?? $expense->transaction_date)->startOfDay();
            $invoice = null;

            if ($expense->type === 'credit') {
                $invoice = $this->resolveInvoice(
                    $user,
                    $method,
                    $date,
                    array_key_exists('invoice_id', $data) ? $data['invoice_id'] : null,
                    $data['invoice_reference_year'] ?? null,
                    $data['invoice_reference_month'] ?? null,
                );
            }

            $expense->fill([
                'payment_method_id' => $method->id,
                'destination_payment_method_id' => $destinationMethod?->id,
                'invoice_id' => $invoice?->id,
                'description' => $data['description'] ?? $expense->description,
                'amount' => $data['amount'] ?? $expense->amount,
                'transaction_date' => $date->toDateString(),
            ]);
            $expense->save();

            $this->applyBalanceEffect($expense, 1);

            $expense->refresh()->load(['paymentMethod', 'destinationPaymentMethod', 'invoice.paymentMethod']);
            $expense->invoice?->loadSum(
                ['expenses as total_amount' => fn ($query) => $query->where('type', 'credit')],
                'amount'
            );

            return $expense;
        });
    }

    public function deleteExpense(User $user, Expense $expense): void
    {
        DB::transaction(function () use ($user, $expense): void {
            $expense = Expense::query()
                ->whereKey($expense->id)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($expense->type === 'invoice_payment') {
                $this->validationError('expense', 'O pagamento de uma fatura não pode ser excluído.');
            }

            if ($expense->type === 'credit' && $expense->invoice?->status === 'paid') {
                $this->validationError('expense', 'Não é possível excluir uma compra de fatura já paga.');
            }

            $this->applyBalanceEffect($expense, -1);
            $expense->delete();
        });
    }

    public function payInvoice(User $user, Invoice $invoice, array $data): Invoice
    {
        return DB::transaction(function () use ($user, $invoice, $data): Invoice {
            $invoice = Invoice::query()
                ->whereKey($invoice->id)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($invoice->status !== 'open') {
                $this->validationError('invoice', 'Esta fatura já foi paga.');
            }

            $paymentMethod = $this->lockedMethod($user, $data['payment_method_id']);
            $total = $invoice->expenses()->where('type', 'credit')->sum('amount');
            if ((float) $total <= 0) {
                $this->validationError('invoice', 'Não é possível pagar uma fatura sem compras.');
            }

            $expense = $user->expenses()->create([
                'payment_method_id' => $paymentMethod->id,
                'invoice_id' => $invoice->id,
                'description' => sprintf(
                    'Pagamento da fatura %02d/%d - %s',
                    $invoice->reference_month,
                    $invoice->reference_year,
                    $invoice->paymentMethod->name
                ),
                'amount' => $total,
                'transaction_date' => $data['transaction_date'] ?? now()->toDateString(),
                'type' => 'invoice_payment',
            ]);

            $this->applyBalanceEffect($expense, 1);

            $invoice->update([
                'status' => 'paid',
                'paid_at' => now(),
                'paid_from_payment_method_id' => $paymentMethod->id,
                'payment_expense_id' => $expense->id,
            ]);

            return $invoice->refresh()->load(['paymentMethod', 'paidFromPaymentMethod']);
        });
    }

    private function resolveInvoice(
        User $user,
        PaymentMethod $card,
        Carbon $date,
        ?int $invoiceId,
        ?int $referenceYear = null,
        ?int $referenceMonth = null,
    ): Invoice
    {
        if ($invoiceId !== null) {
            $invoice = Invoice::query()
                ->whereKey($invoiceId)
                ->where('user_id', $user->id)
                ->where('payment_method_id', $card->id)
                ->lockForUpdate()
                ->first();

            if (! $invoice || $invoice->status !== 'open') {
                $this->validationError('invoice_id', 'Selecione uma fatura aberta do mesmo cartão.');
            }

            return $invoice;
        }

        $reference = $referenceYear !== null && $referenceMonth !== null
            ? Carbon::create($referenceYear, $referenceMonth, 1)
            : $date->copy()->addMonthNoOverflow();

        $invoices = $user->invoices()
            ->where('payment_method_id', $card->id)
            ->where('reference_year', $reference->year)
            ->where('reference_month', $reference->month)
            ->orderByDesc('cycle')
            ->lockForUpdate()
            ->get();

        $openInvoice = $invoices->firstWhere('status', 'open');
        if ($openInvoice) {
            return $openInvoice;
        }

        return $user->invoices()->create([
            'payment_method_id' => $card->id,
            'reference_year' => $reference->year,
            'reference_month' => $reference->month,
            'cycle' => ($invoices->max('cycle') ?? 0) + 1,
            'status' => 'open',
        ])->refresh();
    }

    private function lockedMethod(User $user, int $methodId): PaymentMethod
    {
        $method = PaymentMethod::query()
            ->whereKey($methodId)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->lockForUpdate()
            ->first();

        if (! $method) {
            $this->validationError('payment_method_id', 'Método de pagamento inválido, inativo ou não pertencente ao usuário.');
        }

        return $method;
    }

    private function assertMethodCompatibility(string $type, PaymentMethod $method, ?PaymentMethod $destinationMethod): void
    {
        $valid = $type === 'transfer'
            ? $destinationMethod !== null
            : $destinationMethod === null;

        if (! $valid) {
            $this->validationError('destination_payment_method_id', 'Informe um destino apenas para transferências.');
        }
    }

    private function applyBalanceEffect(Expense $expense, int $direction): void
    {
        $amount = (float) $expense->amount;

        match ($expense->type) {
            'debit', 'boleto', 'invoice_payment' => $this->changeBalance($expense->payment_method_id, -$amount * $direction),
            'deposit' => $this->changeBalance($expense->payment_method_id, $amount * $direction),
            'transfer' => $this->applyTransferBalanceEffect($expense, $amount, $direction),
            default => null,
        };
    }

    private function applyTransferBalanceEffect(Expense $expense, float $amount, int $direction): void
    {
        $this->changeBalance($expense->payment_method_id, -$amount * $direction);
        $this->changeBalance($expense->destination_payment_method_id, $amount * $direction);
    }

    private function changeBalance(?int $methodId, float $delta): void
    {
        if ($methodId === null || $delta === 0.0) {
            return;
        }

        if ($delta > 0) {
            PaymentMethod::query()->whereKey($methodId)->increment('balance', $delta);

            return;
        }

        PaymentMethod::query()->whereKey($methodId)->decrement('balance', abs($delta));
    }

    private function validationError(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => [$message]]);
    }
}
