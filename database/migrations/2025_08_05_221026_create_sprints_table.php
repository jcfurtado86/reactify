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
    Schema::create('sprints', function (Blueprint $table) {
      $table->id();
      $table->foreignId('project_id')->constrained()->onDelete('cascade');
      $table->string('name');
      $table->date('start_date');
      $table->date('end_date');
      $table->enum('status', ['active', 'completed'])->default('active');
      $table->timestamps();
      $table->softDeletes();

      // Índices para performance
      // $table->index(['project_id', 'status']);
      // $table->index(['start_date', 'end_date']);

      // Constraint para garantir que end_date > start_date
      // $table->index(['project_id', 'start_date', 'end_date']);
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('sprints');
  }
};
