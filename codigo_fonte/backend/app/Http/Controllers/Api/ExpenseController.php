<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Services\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class ExpenseController extends Controller {
    public function index(Request $request) {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'type' => ['nullable', 'string'],
            'payment_method_id' => ['nullable', 'integer'],
            'invoice_id' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:1000'],
        ]);

        $expenses = $request->user()
            ->expenses()
            ->with(['paymentMethod', 'destinationPaymentMethod', 'invoice.paymentMethod'])
            ->when($data['from'] ?? null, fn ($query, $from) => $query->where('transaction_date', '>=', $from))
            ->when($data['to'] ?? null, fn ($query, $to) => $query->where('transaction_date', '<=', $to))
            ->when($data['type'] ?? null, fn ($query, $type) => $query->where('type', $type))
            ->when(
                $data['payment_method_id'] ?? null,
                fn ($query, $methodId) => $query->where('payment_method_id', $methodId)
            )
            ->when($data['invoice_id'] ?? null, fn ($query, $invoiceId) => $query->where('invoice_id', $invoiceId))
            ->latest('transaction_date')
            ->latest('id')
            ->paginate($data['per_page'] ?? 100)
            ->withQueryString();

        return ExpenseResource::collection($expenses);
    }

    public function store(StoreExpenseRequest $request, FinanceService $finance): JsonResponse {
        $expense = $finance->createExpense($request->user(), $request->validated());

        return response()->json([
            'message' => 'Transação criada com sucesso.',
            'data' => new ExpenseResource($expense),
        ], 201);
    }

    public function show(Request $request, Expense $expense): ExpenseResource {
        $this->assertOwnership($request, $expense);

        return new ExpenseResource($expense->load(['paymentMethod', 'destinationPaymentMethod', 'invoice.paymentMethod']));
    }

    public function update(
        UpdateExpenseRequest $request,
        Expense $expense,
        FinanceService $finance
    ): JsonResponse {
        $this->assertOwnership($request, $expense);
        $expense = $finance->updateExpense($request->user(), $expense, $request->validated());

        return response()->json([
            'message' => 'Transação atualizada com sucesso.',
            'data' => new ExpenseResource($expense),
        ]);
    }

    public function destroy(Request $request, Expense $expense, FinanceService $finance): JsonResponse {
        $this->assertOwnership($request, $expense);
        $finance->deleteExpense($request->user(), $expense);

        return response()->json([
            'message' => 'Transação excluída com sucesso.',
        ]);
    }

    private function assertOwnership(Request $request, Expense $expense): void {
        abort_unless($expense->user_id === $request->user()->id, 404);
    }

    public function exportPdf(Request $request) {
        $month = $request->query('month');
        $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $end = Carbon::createFromFormat('Y-m', $month)->endOfMonth();

        $expenses = $request->user()->expenses()
            ->with('paymentMethod', 'invoice')
            ->whereBetween('transaction_date', [$start, $end])
            ->orderBy('transaction_date', 'desc')
            ->get();

        $linhas = '';
        $totalDeposito = 0;
        $totalCredito = 0;
        $totalDebito = 0;
        $totalGeral = 0;

        foreach($expenses as $expense) {
            $valorFormatado = number_format($expense->amount, 2, ',', '.');
            $tipo = strtoupper($expense->type);
            $dataStr = Carbon::parse($expense->transaction_date)->format('d/m/Y');
            
            if($expense->type === 'credit') {
                $totalCredito += $expense->amount;
            }elseif($expense->type === 'deposit') {
                $totalDeposito += $expense->amount;
            }elseif(in_array($expense->type, ['debit', 'boleto'])) {
                $totalDebito += $expense->amount;
            }
            $totalGeral += $expense->amount;

            $linhas .= "
            <tr>
                <td>{$expense->description}</td>
                <td>{$dataStr}</td>
                <td>{$tipo}</td>
                <td style='text-align: right'>R$ {$valorFormatado}</td>
            </tr>";
        }

        $totalCreditoStr = number_format($totalCredito, 2, ',', '.');
        $totalDebitoStr = number_format($totalDebito, 2, ',', '.');
        $totalGeralStr = number_format($totalGeral, 2, ',', '.');
        $totalDepositStr = number_format($totalDeposito, 2, ',', '.');

        $html = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <title>Relatório de Despesas</title>
            <style>
                *, *::before, *::after { box-sizing: border-box; }
                @page { size: A4; margin: 15mm 15mm; background-color: #f8fafc; }
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; margin: 0; padding: 0; }
                .header { text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0; }
                .header h1 { color: #0f172a; font-size: 22pt; margin: 0 0 5px 0; }
                .header h2 { color: #64748b; font-size: 14pt; font-weight: normal; margin: 0; }
                table { width: 100%; border-collapse: collapse; font-size: 10pt; background: #ffffff; border-radius: 8px; overflow: hidden; margin-bottom: 20px;}
                th { background-color: #f1f5f9; color: #475569; text-align: left; padding: 12px; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; font-size: 9pt; }
                td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid; }
                tr:last-child td { border-bottom: none; }
                .totals-box { margin-top: 20px; padding: 15px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; page-break-inside: avoid; text-align: right; }
                .totals-row { margin-bottom: 8px; color: #475569; font-size: 11pt; }
                .totals-row strong { font-size: 12pt; }
                .totals-general { font-size: 14pt; font-weight: bold; color: #0f172a; margin-top: 15px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
            </style>
        </head>
        <body>
            <div class='header'>
                <h1>Relatório de Despesas</h1>
                <!-- Removemos a string 'Mês:' -->
                <h2>{$month}</h2>
            </div>
            <table>
                <thead>
                    <tr><th>Descrição</th><th>Data</th><th>Tipo</th><th style='text-align: right'>Valor</th></tr>
                </thead>
                <tbody>
                    {$linhas}
                </tbody>
            </table>
            <!-- Nova caixa com os totais -->
            <div class='totals-box'>
                <div class='totals-row'>Total no Depósito: <strong style='color: #cea229;'>R$ {$totalDepositStr}</strong></div>
                <div class='totals-row'>Total no Crédito: <strong style='color: #059669;'>R$ {$totalCreditoStr}</strong></div>
                <div class='totals-row'>Total no Débito/Boletos: <strong style='color: #2563eb;'>R$ {$totalDebitoStr}</strong></div>
                <div class='totals-general'>Total de Movimentações: <span style='color: #0f172a;'>R$ {$totalGeralStr}</span></div>
            </div>
        </body>
        </html>";

        $pdf = Pdf::loadHTML($html);
        $filename = 'despesa_' . str_replace('-', '_', $month) . '.pdf';
        
        return $pdf->download($filename);
    }
}
