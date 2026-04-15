<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_rules', function (Blueprint $table) {
            if (!Schema::hasColumn('business_rules', 'rule_type')) {
                $table->string('rule_type', 20)->nullable()->after('title');
            }
        });
    }

    public function down(): void
    {
        Schema::table('business_rules', function (Blueprint $table) {
            if (Schema::hasColumn('business_rules', 'rule_type')) {
                $table->dropColumn('rule_type');
            }
        });
    }
};
