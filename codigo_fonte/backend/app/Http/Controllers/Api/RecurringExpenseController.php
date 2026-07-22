<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRecurringExpenseRequest;
use App\Http\Requests\UpdateRecurringExpenseRequest;
use App\Http\Resources\RecurringExpenseResource;
use App\Models\RecurringExpense;
use App\Services\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecurringExpenseController extends Controller
{
    public function index(Request $request)
    {
        $recurringExpenses = $request->user()
            ->recurringExpenses()
            ->with('paymentMethod')
            ->latest()
            ->get();

        return RecurringExpenseResource::collection($recurringExpenses);
    }

    public function store(StoreRecurringExpenseRequest $request, FinanceService $finance): JsonResponse
    {
        $recurringExpense = $request->user()->recurringExpenses()->create($request->validated());

        $finance->createExpense($request->user(), [
            'description' => $recurringExpense->description,
            'amount' => $recurringExpense->amount,
            'payment_method_id' => $recurringExpense->payment_method_id,
            'type' => 'fixed_expense',
            'transaction_date' => now()->toDateString(),
            'is_paid' => false,
        ]);

        return response()->json([
            'message' => 'Despesa fixa criada com sucesso.',
            'data' => new RecurringExpenseResource($recurringExpense->load('paymentMethod')),
        ], 201);
    }

    public function show(Request $request, RecurringExpense $recurringExpense): RecurringExpenseResource
    {
        $this->assertOwnership($request, $recurringExpense);

        return new RecurringExpenseResource($recurringExpense->load('paymentMethod'));
    }

    public function update(UpdateRecurringExpenseRequest $request, RecurringExpense $recurringExpense): JsonResponse
    {
        $this->assertOwnership($request, $recurringExpense);
        $recurringExpense->update($request->validated());

        return response()->json([
            'message' => 'Despesa fixa atualizada com sucesso.',
            'data' => new RecurringExpenseResource($recurringExpense->fresh()->load('paymentMethod')),
        ]);
    }

    public function destroy(Request $request, RecurringExpense $recurringExpense): JsonResponse
    {
        $this->assertOwnership($request, $recurringExpense);
        $recurringExpense->delete();

        return response()->json([
            'message' => 'Despesa fixa excluída com sucesso.',
        ]);
    }

    private function assertOwnership(Request $request, RecurringExpense $recurringExpense): void
    {
        abort_unless($recurringExpense->user_id === $request->user()->id, 404);
    }
}