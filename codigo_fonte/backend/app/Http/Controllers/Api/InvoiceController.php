<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PayInvoiceRequest;
use App\Http\Resources\ExpenseResource;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Services\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'payment_method_id' => ['nullable', 'integer'],
            'reference_year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'reference_month' => ['nullable', 'integer', 'between:1,12'],
            'status' => ['nullable', 'in:open,paid'],
        ]);

        $invoices = $request->user()
            ->invoices()
            ->with(['paymentMethod', 'paidFromPaymentMethod'])
            ->withSum(['expenses as total_amount' => fn ($query) => $query->where('type', 'credit')], 'amount')
            ->when(
                $filters['payment_method_id'] ?? null,
                fn ($query, $methodId) => $query->where('payment_method_id', $methodId)
            )
            ->when(
                $filters['reference_year'] ?? null,
                fn ($query, $year) => $query->where('reference_year', $year)
            )
            ->when(
                $filters['reference_month'] ?? null,
                fn ($query, $month) => $query->where('reference_month', $month)
            )
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->orderByDesc('reference_year')
            ->orderByDesc('reference_month')
            ->orderByDesc('cycle')
            ->get();

        return InvoiceResource::collection($invoices);
    }

    public function show(Request $request, Invoice $invoice): JsonResponse
    {
        $this->assertOwnership($request, $invoice);
        $invoice->load(['paymentMethod', 'paidFromPaymentMethod']);
        $invoice->loadSum(['expenses as total_amount' => fn ($query) => $query->where('type', 'credit')], 'amount');
        $expenses = $invoice->expenses()
            ->where('type', 'credit')
            ->with(['paymentMethod', 'invoice.paymentMethod'])
            ->latest('transaction_date')
            ->get();

        return response()->json([
            'data' => [
                'invoice' => new InvoiceResource($invoice),
                'expenses' => ExpenseResource::collection($expenses),
            ],
        ]);
    }

    public function pay(
        PayInvoiceRequest $request,
        Invoice $invoice,
        FinanceService $finance
    ): JsonResponse {
        $this->assertOwnership($request, $invoice);
        $invoice = $finance->payInvoice($request->user(), $invoice, $request->validated());
        $invoice->loadSum(['expenses as total_amount' => fn ($query) => $query->where('type', 'credit')], 'amount');
        $paymentExpense = $request->user()
            ->expenses()
            ->with(['paymentMethod', 'invoice.paymentMethod'])
            ->findOrFail($invoice->payment_expense_id);

        return response()->json([
            'message' => 'Fatura paga com sucesso.',
            'data' => new InvoiceResource($invoice),
            'payment_expense' => new ExpenseResource($paymentExpense),
        ]);
    }

    private function assertOwnership(Request $request, Invoice $invoice): void
    {
        abort_unless($invoice->user_id === $request->user()->id, 404);
    }
}
