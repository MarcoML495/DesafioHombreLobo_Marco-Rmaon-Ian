<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id('id')->primary();
            $table->string('join_code', 12)->unique()->nullable();
            $table->foreignId('created_by_user_id')->index();
            $table->enum('status', ['lobby', 'in_progress', 'finished']);
            $table->integer('min_players')->default(15);
            $table->integer('max_players')->default(30);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
