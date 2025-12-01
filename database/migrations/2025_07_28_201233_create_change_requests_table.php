<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

use App\Enums\ChangeRequestStatus;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('change_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            // $table->foreignId('requested_by_id')->constrained('users')->onDelete('cascade');
            $table->string('requester_name');
            $table->text('description');
            $table->string('status')->default(ChangeRequestStatus::SOLICITADA->value);
            // $table->unsignedTinyInteger('effort')->nullable();
            $table->date('request_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('change_requests');
    }
};
