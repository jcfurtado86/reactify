<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    private array $tables = [
        'personas',
        'goal_sketches',
        'journeys',
        'stories',
        'business_rules',
        'usage_scenarios',
        'system_interfaces',
        'overall_model_classes',
        'crc_cards',
        'product_canvas',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            if (!Schema::hasTable($table)) {
                continue;
            }
            if (Schema::hasColumn($table, 'is_ai_generated')) {
                continue;
            }
            Schema::table($table, function (Blueprint $t) {
                $t->boolean('is_ai_generated')->default(false);
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            if (!Schema::hasTable($table)) {
                continue;
            }
            if (!Schema::hasColumn($table, 'is_ai_generated')) {
                continue;
            }
            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn('is_ai_generated');
            });
        }
    }
};
