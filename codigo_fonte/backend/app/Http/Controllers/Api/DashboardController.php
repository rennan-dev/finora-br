<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExpenseResource;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\PaymentMethodResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'expenses_limit' => ['nullable', 'integer', 'min:20', 'max:200'],
        ]);
        $user = $request->user();
        $limit = $data['expenses_limit'] ?? 150;

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
            ->limit($limit)
            ->get();

        $expenses = $user->expenses()
            ->with(['paymentMethod', 'destinationPaymentMethod', 'invoice.paymentMethod'])
            ->latest('transaction_date')
            ->latest('id')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => [
                'payment_methods' => PaymentMethodResource::collection($paymentMethods)->resolve($request),
                'invoices' => InvoiceResource::collection($invoices)->resolve($request),
                'expenses' => ExpenseResource::collection($expenses)->resolve($request),
            ],
        ]);
    }
}
