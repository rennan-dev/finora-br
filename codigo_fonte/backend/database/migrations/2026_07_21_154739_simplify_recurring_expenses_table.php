<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recurring_expenses', function (Blueprint $table) {
            $table->dropColumn(['type', 'day']);
        });
    }

    public function down(): void
    {
        Schema::table('recurring_expenses', function (Blueprint $table) {
            $table->enum('type', ['credit', 'debit', 'boleto'])->after('payment_method_id');
            $table->tinyInteger('day')->unsigned()->after('type');
        });
    }
};