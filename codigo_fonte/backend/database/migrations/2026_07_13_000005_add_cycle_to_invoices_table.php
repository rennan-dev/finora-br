<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->unsignedSmallInteger('cycle')->default(1)->after('reference_month');
            $table->dropUnique('invoices_user_card_reference_unique');
            $table->unique(
                ['user_id', 'payment_method_id', 'reference_year', 'reference_month', 'cycle'],
                'invoices_user_card_reference_cycle_unique'
            );
            $table->index(
                ['user_id', 'payment_method_id', 'reference_year', 'reference_month', 'status'],
                'invoices_user_card_reference_status_index'
            );
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('invoices_user_card_reference_status_index');
            $table->dropUnique('invoices_user_card_reference_cycle_unique');
            $table->dropColumn('cycle');
            $table->unique(
                ['user_id', 'payment_method_id', 'reference_year', 'reference_month'],
                'invoices_user_card_reference_unique'
            );
        });
    }
};
