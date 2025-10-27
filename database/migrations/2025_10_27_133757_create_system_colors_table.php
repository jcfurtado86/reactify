<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::create('system_colors', function (Blueprint $table) {
      $table->id();
      $table
        ->foreignId('project_id')
        ->constrained('projects')
        ->onDelete('cascade'); // Chave estrangeira
      $table
        ->jsonb('stories')
        ->default('{"system": "#f97316", "user": "#22c55e"}');
      $table
        ->jsonb('goals')
        ->default(
          '{"bg": "#5B4533", "cg": "#3b82f6", "low": "#22c55e", "medium": "#eab308", "high": "#f97316"}'
        );
      $table->unique('project_id');
      $table->timestamps();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('system_colors');
  }
};
