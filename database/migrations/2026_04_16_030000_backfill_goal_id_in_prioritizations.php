<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $projects = DB::table('projects')->pluck('id');

        foreach ($projects as $projectId) {
            $goals = DB::table('goal_sketches')
                ->where('project_id', $projectId)
                ->whereNull('deleted_at')
                ->orderBy('id')
                ->pluck('id')
                ->values();

            if ($goals->isEmpty()) continue;

            $prioritizations = DB::table('prioritizations')
                ->where('project_id', $projectId)
                ->whereNull('goal_id')
                ->get();

            foreach ($prioritizations as $p) {
                $goalId = $goals->get($p->position);
                if ($goalId) {
                    DB::table('prioritizations')
                        ->where('id', $p->id)
                        ->update(['goal_id' => $goalId]);
                }
            }
        }
    }

    public function down(): void
    {
        DB::table('prioritizations')->update(['goal_id' => null]);
    }
};
