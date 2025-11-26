<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up()
  {
    Schema::create("personas", function (Blueprint $table) {
      $table->id();
      $table->string("name");
      $table->jsonb('invest_card')->nullable();
      $table->jsonb("profile");
      $table->jsonb("expectations");
      $table->jsonb("goals");
      $table
        ->foreignId("project_id")
        ->constrained("projects")
        ->onDelete("cascade");
      $table->timestamps();
      $table->softDeletes();
    });
  }

  public function down()
  {
    Schema::dropIfExists("personas");
  }
};
