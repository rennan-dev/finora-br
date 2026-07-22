<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE expenses MODIFY COLUMN type ENUM('credit', 'debit', 'deposit', 'transfer', 'boleto', 'invoice_payment', 'fixed_expense') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE expenses MODIFY COLUMN type ENUM('credit', 'debit', 'deposit', 'transfer', 'boleto', 'invoice_payment') NOT NULL");
    }
};