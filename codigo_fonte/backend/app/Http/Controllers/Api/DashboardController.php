<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\PaymentMethodResource;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller {
    //retorna apenas dados globais que não mudam com o mês selecionado
    public function index(Request $request): JsonResponse {
        $user = $request->user();

        $paymentMethods = $user->paymentMethods()
            ->where('is_active', true)
            ->orderByDesc('is_favorite')
            ->orderBy('name')
            ->get();

        $invoices = $user->invoices()
            ->with(['paymentMethod', 'paidFromPaymentMethod'])
            ->withSum(['expenses as total_amount' => fn ($query) => $query->where('type', 'credit')], 'amount')
            ->orderByDesc('reference_year')
            ->orderByDesc('reference_month')
            ->orderByDesc('cycle')
            ->get();

        return response()->json([
            'data' => [
                'balance' => $paymentMethods->sum('balance'),
                'payment_methods' => PaymentMethodResource::collection($paymentMethods)->resolve($request),
                'invoices' => InvoiceResource::collection($invoices)->resolve($request),
            ],
        ]);
    }

    //retorna os totais de Crédito, Débito e Depósito do Mês Selecionado (Para a Pizza e Cards)
    public function summary(Request $request): JsonResponse {
        $request->validate([
            'month' => ['required', 'date_format:Y-m'],
        ]);

        $start = Carbon::createFromFormat('Y-m', $request->month)->startOfMonth();
        $end = Carbon::createFromFormat('Y-m', $request->month)->endOfMonth();

        $totals = $request->user()->expenses()
            ->whereBetween('transaction_date', [$start, $end])
            ->select('type', DB::raw('SUM(amount) as total'))
            ->groupBy('type')
            ->pluck('total', 'type');

        return response()->json([
            'data' => [
                'credit' => (float) ($totals['credit'] ?? 0),
                'debit' => (float) ($totals['debit'] ?? 0) + (float) ($totals['boleto'] ?? 0),
                'deposit' => (float) ($totals['deposit'] ?? 0),
            ]
        ]);
    }

    //retorna a linha do tempo dos últimos 6 meses (Para o Gráfico de Evolução de Gastos)
    public function evolution(Request $request): JsonResponse {
        $request->validate([
            'month' => ['required', 'date_format:Y-m'],
        ]);

        $baseStart = Carbon::createFromFormat('Y-m', $request->month)->startOfMonth();
        $end = Carbon::createFromFormat('Y-m', $request->month)->endOfMonth();
        $startMonthly = $baseStart->copy()->subMonths(5);
        $startDaily = $baseStart->copy();

        Carbon::setLocale('pt_BR');

        $expensesMonthly = $request->user()->expenses()
            ->whereBetween('transaction_date', [$startMonthly, $end])
            ->select(
                DB::raw('DATE_FORMAT(transaction_date, "%Y-%m") as month_group'),
                'type',
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('month_group', 'type')
            ->get();

        $evolutionMonthly = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = $baseStart->copy()->subMonths($i);
            $monthKey = $date->format('Y-m');
            
            $evolutionMonthly[$monthKey] = [
                'name' => str_replace('.', '', $date->shortMonthName),
                'Crédito' => 0,
                'Débito' => 0,
                'Depósito' => 0,
            ];
        }

        foreach ($expensesMonthly as $expense) {
            $key = $expense->month_group;
            if (!isset($evolutionMonthly[$key])) continue;

            $amount = (float) $expense->total;
            if ($expense->type === 'credit') {
                $evolutionMonthly[$key]['Crédito'] += $amount;
            } elseif (in_array($expense->type, ['debit', 'boleto'])) {
                $evolutionMonthly[$key]['Débito'] += $amount;
            } elseif ($expense->type === 'deposit') {
                $evolutionMonthly[$key]['Depósito'] += $amount;
            }
        }

        $expensesDaily = $request->user()->expenses()
            ->whereBetween('transaction_date', [$startDaily, $end])
            ->select(
                DB::raw('DATE_FORMAT(transaction_date, "%Y-%m-%d") as day_group'),
                'type',
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('day_group', 'type')
            ->get();

        $evolutionDaily = [];
        $daysInMonth = $end->daysInMonth;

        for ($i = 1; $i <= $daysInMonth; $i++) {
            $date = $startDaily->copy()->addDays($i - 1);
            $dayKey = $date->format('Y-m-d');
            
            $evolutionDaily[$dayKey] = [
                'name' => $date->format('d/m'),
                'Crédito' => 0,
                'Débito' => 0,
                'Depósito' => 0,
            ];
        }

        foreach ($expensesDaily as $expense) {
            $key = $expense->day_group;
            if (!isset($evolutionDaily[$key])) continue;

            $amount = (float) $expense->total;
            if ($expense->type === 'credit') {
                $evolutionDaily[$key]['Crédito'] += $amount;
            } elseif (in_array($expense->type, ['debit', 'boleto'])) {
                $evolutionDaily[$key]['Débito'] += $amount;
            } elseif ($expense->type === 'deposit') {
                $evolutionDaily[$key]['Depósito'] += $amount;
            }
        }

        return response()->json([
            'data' => [
                'monthly' => array_values($evolutionMonthly),
                'daily' => array_values($evolutionDaily)
            ]
        ]);
    }
}