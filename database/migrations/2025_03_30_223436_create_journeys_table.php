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
    Schema::create('journeys', function (Blueprint $table) {
      $table->id();
      $table->string('title');
      $table->jsonb('steps');
      $table->jsonb('invest_card')->nullable();
      $table->foreignId('project_id')->constrained()->onDelete('cascade');
      $table->timestamps();
      $table->softDeletes();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('journeys');
  }
};
