<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_method_id')->constrained()->restrictOnDelete();
            $table->unsignedSmallInteger('reference_year');
            $table->unsignedTinyInteger('reference_month');
            $table->enum('status', ['open', 'paid'])->default('open');
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('paid_from_payment_method_id')
                ->nullable()
                ->constrained('payment_methods')
                ->nullOnDelete();
            $table->unsignedBigInteger('payment_expense_id')->nullable();
            $table->timestamps();

            $table->unique(
                ['user_id', 'payment_method_id', 'reference_year', 'reference_month'],
                'invoices_user_card_reference_unique'
            );
            $table->index(['user_id', 'status', 'reference_year', 'reference_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
