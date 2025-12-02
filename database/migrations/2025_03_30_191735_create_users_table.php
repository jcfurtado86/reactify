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
    Schema::create("user_roles", function (Blueprint $table) {
      $table->id();
      $table->string("name")->unique(); // Ex: "admin", "editor"
      $table->boolean("can_create")->default(false);
      $table->boolean("can_read")->default(false);
      $table->boolean("can_update")->default(false);
      $table->softDeletes();
    });

    Schema::create("users", function (Blueprint $table) {
      $table->id();
      // colunas referentes a autenticacao
      $table->string("provider_name")->nullable();
      $table->string("provider_id")->nullable();
      $table->string("provider_avatar")->nullable();
      // colunas referentes a informacoes do usuario
      $table->string("name");
      $table->string("email")->unique();
      $table->timestamp("email_verified_at")->nullable();
      $table->string("password")->nullable();
      $table->boolean("active")->default(false);
      $table->string("avatar_path", 2048)->nullable();
      $table->rememberToken();
      $table->timestamps();
      $table->softDeletes();
    });

    Schema::create("password_reset_tokens", function (Blueprint $table) {
      $table->string("email")->primary();
      $table->string("token");
      $table->timestamp("created_at")->nullable();
    });

    Schema::create("sessions", function (Blueprint $table) {
      $table->string("id")->primary();
      $table->foreignId("user_id")->nullable()->index();
      $table->string("ip_address", 45)->nullable();
      $table->text("user_agent")->nullable();
      $table->longText("payload");
      $table->integer("last_activity")->index();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists("users");
    Schema::dropIfExists("user_roles");
    Schema::dropIfExists("password_reset_tokens");
    Schema::dropIfExists("sessions");
  }
};
