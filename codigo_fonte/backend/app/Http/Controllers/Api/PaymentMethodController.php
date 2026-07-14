<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaymentMethodRequest;
use App\Http\Requests\UpdatePaymentMethodRequest;
use App\Http\Resources\PaymentMethodResource;
use App\Models\PaymentMethod;
use App\Services\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentMethodController extends Controller
{
    public function index(Request $request)
    {
        $methods = $request->user()
            ->paymentMethods()
            ->when(! $request->boolean('include_inactive'), fn ($query) => $query->where('is_active', true))
            ->orderByDesc('is_favorite')
            ->orderBy('name')
            ->get();

        return PaymentMethodResource::collection($methods);
    }

    public function store(StorePaymentMethodRequest $request, FinanceService $finance): JsonResponse
    {
        $method = $finance->createPaymentMethod($request->user(), $request->validated());

        return response()->json([
            'message' => 'Método de pagamento criado com sucesso.',
            'data' => new PaymentMethodResource($method),
        ], 201);
    }

    public function show(Request $request, PaymentMethod $paymentMethod): PaymentMethodResource
    {
        $this->assertOwnership($request, $paymentMethod);

        return new PaymentMethodResource($paymentMethod);
    }

    public function update(
        UpdatePaymentMethodRequest $request,
        PaymentMethod $paymentMethod,
        FinanceService $finance
    ): JsonResponse {
        $this->assertOwnership($request, $paymentMethod);
        $method = $finance->updatePaymentMethod($request->user(), $paymentMethod, $request->validated());

        return response()->json([
            'message' => 'Método de pagamento atualizado com sucesso.',
            'data' => new PaymentMethodResource($method),
        ]);
    }

    public function destroy(Request $request, PaymentMethod $paymentMethod, FinanceService $finance): JsonResponse
    {
        $this->assertOwnership($request, $paymentMethod);
        $finance->deactivatePaymentMethod($request->user(), $paymentMethod);

        return response()->json([
            'message' => 'Método de pagamento desativado com sucesso.',
        ]);
    }

    private function assertOwnership(Request $request, PaymentMethod $paymentMethod): void
    {
        abort_unless($paymentMethod->user_id === $request->user()->id, 404);
    }
}
