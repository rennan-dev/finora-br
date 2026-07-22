<?php

namespace App\Console\Commands;

use App\Models\Expense;
use App\Models\RecurringExpense;
use Carbon\Carbon;
use Illuminate\Console\Command;

class GenerateRecurringExpenses extends Command
{
    protected $signature = 'app:generate-recurring-expenses';

    protected $description = 'Gera despesas fixas recorrentes no dia 1 de cada mês';

    public function handle(): void
    {
        $today = Carbon::today();

        if ((int) $today->format('j') !== 1) {
            $this->info('Hoje não é dia 1. Nenhuma despesa fixa gerada.');
            return;
        }

        $month = (int) $today->format('n');
        $year = (int) $today->format('Y');

        $recurringExpenses = RecurringExpense::query()
            ->where('is_active', true)
            ->get()
            ->groupBy('user_id');

        foreach ($recurringExpenses as $userId => $userExpenses) {
            foreach ($userExpenses as $recurring) {
                $alreadyGenerated = Expense::query()
                    ->where('user_id', $recurring->user_id)
                    ->where('description', $recurring->description)
                    ->where('amount', $recurring->amount)
                    ->whereYear('transaction_date', $year)
                    ->whereMonth('transaction_date', $month)
                    ->exists();

                if ($alreadyGenerated) {
                    continue;
                }

                $recurring->user->expenses()->create([
                    'payment_method_id' => $recurring->payment_method_id,
                    'description' => $recurring->description,
                    'amount' => $recurring->amount,
                    'transaction_date' => $today->toDateString(),
                    'type' => 'fixed_expense',
                    'is_paid' => false,
                ]);
            }
        }

        $this->info('Despesas fixas geradas com sucesso.');
    }
}