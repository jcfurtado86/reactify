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
    Schema::create('priorities', function (Blueprint $table) {
      $table->id();
      $table->string('value');
    });

    Schema::create('goal_sketches', function (Blueprint $table) {
      $table->id();
      $table->string(column: 'title');
      $table->enum('type', ['bg', 'cg']);
      $table->enum('priority', ['low', 'medium', 'high']);
      $table->jsonb('invest_card')->nullable();
      $table
        ->foreignId('project_id')
        ->constrained('projects')
        ->onDelete('cascade');
      $table->timestamps();
      $table->softDeletes();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('goal_sketches');
    Schema::dropIfExists('priorities');
  }
};
