<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FinanceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_define_only_one_global_favorite_payment_method(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/payment-methods', [
            'name' => 'Conta principal',
            'is_favorite' => true,
        ])->assertCreated();

        $this->postJson('/api/payment-methods', [
            'name' => 'Cartão principal',
            'is_favorite' => true,
        ])->assertCreated();

        $this->assertSame(1, PaymentMethod::where('user_id', $user->id)->where('is_favorite', true)->count());
        $this->assertTrue(
            PaymentMethod::where('user_id', $user->id)->where('name', 'Cartão principal')->firstOrFail()->is_favorite
        );
    }

    public function test_credit_purchase_is_assigned_to_next_calendar_month_invoice(): void
    {
        $user = User::factory()->create();
        $card = PaymentMethod::factory()->create(['user_id' => $user->id]);
        Sanctum::actingAs($user);

        $this->postJson('/api/expenses', [
            'description' => 'Notebook',
            'amount' => 2500,
            'transaction_date' => '2026-07-13',
            'type' => 'credit',
            'payment_method_id' => $card->id,
        ])->assertCreated()
            ->assertJsonPath('data.transaction_date', '2026-07-13')
            ->assertJsonPath('data.invoice.reference_month', 8)
            ->assertJsonPath('data.invoice.reference_year', 2026);
    }

    public function test_credit_purchase_can_be_moved_to_another_open_invoice(): void
    {
        $user = User::factory()->create();
        $card = PaymentMethod::factory()->create(['user_id' => $user->id]);
        $targetInvoice = Invoice::factory()->create([
            'user_id' => $user->id,
            'payment_method_id' => $card->id,
            'reference_month' => 9,
            'reference_year' => 2026,
        ]);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/expenses', [
            'description' => 'Curso',
            'amount' => 100,
            'transaction_date' => '2026-07-13',
            'type' => 'credit',
            'payment_method_id' => $card->id,
        ])->assertCreated();

        $expenseId = $response->json('data.id');

        $this->patchJson("/api/expenses/{$expenseId}", [
            'invoice_reference_month' => 9,
            'invoice_reference_year' => 2026,
        ])->assertOk()
            ->assertJsonPath('data.invoice_id', $targetInvoice->id);
    }

    public function test_editing_credit_purchase_can_create_invoice_for_selected_month(): void
    {
        $user = User::factory()->create();
        $card = PaymentMethod::factory()->create(['user_id' => $user->id]);
        Sanctum::actingAs($user);

        $expenseId = $this->postJson('/api/expenses', [
            'description' => 'Celular',
            'amount' => 800,
            'transaction_date' => '2026-07-13',
            'type' => 'credit',
            'payment_method_id' => $card->id,
        ])->assertCreated()->json('data.id');

        $this->patchJson("/api/expenses/{$expenseId}", [
            'invoice_reference_month' => 12,
            'invoice_reference_year' => 2027,
        ])->assertOk()
            ->assertJsonPath('data.invoice.reference_month', 12)
            ->assertJsonPath('data.invoice.reference_year', 2027);
    }

    public function test_invoice_payment_is_idempotent_and_debits_payer(): void
    {
        $user = User::factory()->create();
        $card = PaymentMethod::factory()->create(['user_id' => $user->id]);
        $payer = PaymentMethod::factory()->create([
            'user_id' => $user->id,
            'balance' => 500,
        ]);
        $invoice = Invoice::factory()->create([
            'user_id' => $user->id,
            'payment_method_id' => $card->id,
        ]);
        $user->expenses()->create([
            'payment_method_id' => $card->id,
            'invoice_id' => $invoice->id,
            'description' => 'Compra no crédito',
            'amount' => 125,
            'transaction_date' => '2026-07-01',
            'type' => 'credit',
        ]);
        Sanctum::actingAs($user);

        $this->postJson("/api/invoices/{$invoice->id}/pay", [
            'payment_method_id' => $payer->id,
            'transaction_date' => '2026-07-20',
        ])->assertOk()
            ->assertJsonPath('data.status', 'paid');

        $this->assertSame('375.00', $payer->refresh()->balance);

        $this->postJson("/api/invoices/{$invoice->id}/pay", [
            'payment_method_id' => $payer->id,
        ])->assertUnprocessable();

        $this->assertSame('375.00', $payer->refresh()->balance);
    }

    public function test_new_credit_purchase_after_payment_starts_separate_open_invoice_cycle(): void
    {
        $user = User::factory()->create();
        $card = PaymentMethod::factory()->create(['user_id' => $user->id]);
        $payer = PaymentMethod::factory()->create(['user_id' => $user->id, 'balance' => 500]);
        $paidInvoice = Invoice::factory()->create([
            'user_id' => $user->id,
            'payment_method_id' => $card->id,
            'reference_month' => 8,
            'reference_year' => 2026,
            'cycle' => 1,
        ]);
        $paidExpense = $user->expenses()->create([
            'payment_method_id' => $card->id,
            'invoice_id' => $paidInvoice->id,
            'description' => 'Compra já quitada',
            'amount' => 100,
            'transaction_date' => '2026-07-13',
            'type' => 'credit',
        ]);
        Sanctum::actingAs($user);

        $this->postJson("/api/invoices/{$paidInvoice->id}/pay", [
            'payment_method_id' => $payer->id,
            'transaction_date' => '2026-07-15',
        ])->assertOk();

        $this->patchJson("/api/expenses/{$paidExpense->id}", [
            'description' => 'Tentativa de alterar compra quitada',
        ])->assertUnprocessable();

        $this->postJson('/api/expenses', [
            'description' => 'Nova compra',
            'amount' => 100,
            'transaction_date' => '2026-07-20',
            'type' => 'credit',
            'payment_method_id' => $card->id,
        ])->assertCreated()
            ->assertJsonPath('data.invoice.reference_month', 8)
            ->assertJsonPath('data.invoice.reference_year', 2026)
            ->assertJsonPath('data.invoice.cycle', 2)
            ->assertJsonPath('data.invoice.status', 'open')
            ->assertJsonPath('data.invoice.total_amount', 100);

        $this->assertSame(100.0, (float) $paidInvoice->expenses()->where('type', 'credit')->sum('amount'));
        $this->assertSame(100.0, (float) Invoice::query()
            ->where('user_id', $user->id)
            ->where('payment_method_id', $card->id)
            ->where('reference_month', 8)
            ->where('reference_year', 2026)
            ->where('cycle', 2)
            ->firstOrFail()
            ->expenses()
            ->where('type', 'credit')
            ->sum('amount'));
    }

    public function test_dashboard_returns_related_finance_data_in_one_request(): void
    {
        $user = User::factory()->create();
        $method = PaymentMethod::factory()->create(['user_id' => $user->id]);
        $user->expenses()->create([
            'payment_method_id' => $method->id,
            'description' => 'Mercado',
            'amount' => 50,
            'transaction_date' => '2026-07-13',
            'type' => 'debit',
        ]);
        Sanctum::actingAs($user);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonCount(1, 'data.payment_methods')
            ->assertJsonCount(1, 'data.expenses')
            ->assertJsonStructure([
                'data' => ['payment_methods', 'expenses', 'invoices'],
            ]);
    }

    public function test_expense_list_respects_pagination_limit(): void
    {
        $user = User::factory()->create();
        $method = PaymentMethod::factory()->create(['user_id' => $user->id]);
        $user->expenses()->createMany([
            [
                'payment_method_id' => $method->id,
                'description' => 'Compra 1',
                'amount' => 10,
                'transaction_date' => '2026-07-12',
                'type' => 'debit',
            ],
            [
                'payment_method_id' => $method->id,
                'description' => 'Compra 2',
                'amount' => 20,
                'transaction_date' => '2026-07-13',
                'type' => 'debit',
            ],
        ]);
        Sanctum::actingAs($user);

        $this->getJson('/api/expenses?per_page=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.per_page', 1)
            ->assertJsonPath('meta.total', 2);
    }
}
