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
use Dompdf\Dompdf;
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

        foreach ($expenses as $expense) {

            $valorFormatado = number_format($expense->amount, 2, ',', '.');
            $tipo = strtoupper($expense->type);
            $dataStr = Carbon::parse($expense->transaction_date)->format('d/m/Y');

            if ($expense->type === 'credit') {
                $totalCredito += $expense->amount;
            } elseif ($expense->type === 'deposit') {
                $totalDeposito += $expense->amount;
            } elseif (in_array($expense->type, ['debit', 'boleto'])) {
                $totalDebito += $expense->amount;
            }

            $totalGeral += $expense->amount;

            $linhas .= "
            <tr>
                <td>{$expense->description}</td>
                <td>{$dataStr}</td>
                <td>{$tipo}</td>
                <td style='text-align:right'>R$ {$valorFormatado}</td>
            </tr>";
        }

        $totalCreditoStr = number_format($totalCredito, 2, ',', '.');
        $totalDebitoStr = number_format($totalDebito, 2, ',', '.');
        $totalDepositStr = number_format($totalDeposito, 2, ',', '.');
        $totalGeralStr = number_format($totalGeral, 2, ',', '.');

        $html = "
        <!DOCTYPE html>
        <html lang='pt-BR'>
        <head>
            <meta charset='UTF-8'>
            <title>Relatório de Despesas</title>

            <style>
                *{
                    box-sizing:border-box;
                }

                @page{
                    margin:15mm;
                }

                body{
                    font-family:DejaVu Sans,sans-serif;
                    color:#334155;
                    font-size:12px;
                }

                .header{
                    text-align:center;
                    margin-bottom:25px;
                    border-bottom:2px solid #e2e8f0;
                    padding-bottom:15px;
                }

                h1{
                    margin:0;
                    color:#0f172a;
                    font-size:22px;
                }

                h2{
                    margin-top:8px;
                    color:#64748b;
                    font-size:14px;
                    font-weight:normal;
                }

                table{
                    width:100%;
                    border-collapse:collapse;
                    margin-top:20px;
                }

                th{
                    background:#f1f5f9;
                    border:1px solid #cbd5e1;
                    padding:10px;
                    text-align:left;
                }

                td{
                    border:1px solid #e2e8f0;
                    padding:8px 10px;
                }

                .right{
                    text-align:right;
                }

                .totals{
                    margin-top:30px;
                    border:1px solid #cbd5e1;
                    padding:15px;
                }

                .totals div{
                    margin-bottom:8px;
                }

                .grand-total{
                    margin-top:15px;
                    padding-top:12px;
                    border-top:1px solid #cbd5e1;
                    font-size:16px;
                    font-weight:bold;
                }
            </style>
        </head>

        <body>

            <div class='header'>
                <h1>Relatório de Despesas</h1>
                <h2>{$month}</h2>
            </div>

            <table>

                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Data</th>
                        <th>Tipo</th>
                        <th class='right'>Valor</th>
                    </tr>
                </thead>

                <tbody>
                    {$linhas}
                </tbody>

            </table>

            <div class='totals'>

                <div>
                    Total no Depósito:
                    <strong>R$ {$totalDepositStr}</strong>
                </div>

                <div>
                    Total no Crédito:
                    <strong>R$ {$totalCreditoStr}</strong>
                </div>

                <div>
                    Total no Débito/Boletos:
                    <strong>R$ {$totalDebitoStr}</strong>
                </div>

                <div class='grand-total'>
                    Total de Movimentações:
                    R$ {$totalGeralStr}
                </div>

            </div>

        </body>
        </html>";

        $dompdf = new Dompdf();

        $dompdf->loadHtml($html);

        $dompdf->setPaper('A4', 'portrait');

        $dompdf->render();

        $filename = 'despesa_' . str_replace('-', '_', $month) . '.pdf';

        return response(
            $dompdf->output(),
            200,
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            ]
        );
    }
}
