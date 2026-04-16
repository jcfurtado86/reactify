<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->dropForeign(['constraint_goal_id']);
            $table->dropColumn('constraint_goal_id');
        });
    }

    public function down(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->foreignId('constraint_goal_id')->nullable()->after('epic_index')
                ->constrained('goal_sketches')->nullOnDelete();
        });
    }
};
