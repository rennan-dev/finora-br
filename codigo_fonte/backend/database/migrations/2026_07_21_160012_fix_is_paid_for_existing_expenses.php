<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Marca como pagas todas as despesas que não são fixed_expense
        // (débito e boleto antigos também são marcados como pagos,
        //  pois antes eram debitados na hora da criação)
        DB::table('expenses')
            ->where('type', '!=', 'fixed_expense')
            ->update(['is_paid' => true]);
    }

    public function down(): void
    {
        // Não é possível reverter
    }
};