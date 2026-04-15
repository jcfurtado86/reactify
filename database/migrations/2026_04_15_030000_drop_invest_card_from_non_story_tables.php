<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        $tables = [
            'personas',
            'goal_sketches',
            'journeys',
            'crc_cards',
            'business_rules',
            'usage_scenarios',
            'system_interfaces',
        ];

        foreach ($tables as $table) {
            if (Schema::hasColumn($table, 'invest_card')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->dropColumn('invest_card');
                });
            }
        }
    }

    public function down(): void
    {
        $tables = [
            'personas',
            'goal_sketches',
            'journeys',
            'crc_cards',
            'business_rules',
            'usage_scenarios',
            'system_interfaces',
        ];

        foreach ($tables as $table) {
            if (!Schema::hasColumn($table, 'invest_card')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->json('invest_card')->nullable();
                });
            }
        }
    }
};
