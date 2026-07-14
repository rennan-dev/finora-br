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

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'type' => ['nullable', 'string'],
            'payment_method_id' => ['nullable', 'integer'],
            'invoice_id' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
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

    public function store(StoreExpenseRequest $request, FinanceService $finance): JsonResponse
    {
        $expense = $finance->createExpense($request->user(), $request->validated());

        return response()->json([
            'message' => 'Transação criada com sucesso.',
            'data' => new ExpenseResource($expense),
        ], 201);
    }

    public function show(Request $request, Expense $expense): ExpenseResource
    {
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

    public function destroy(Request $request, Expense $expense, FinanceService $finance): JsonResponse
    {
        $this->assertOwnership($request, $expense);
        $finance->deleteExpense($request->user(), $expense);

        return response()->json([
            'message' => 'Transação excluída com sucesso.',
        ]);
    }

    private function assertOwnership(Request $request, Expense $expense): void
    {
        abort_unless($expense->user_id === $request->user()->id, 404);
    }
}
