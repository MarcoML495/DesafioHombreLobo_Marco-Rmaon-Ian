<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained('games')->onDelete('cascade');
            $table->foreignId('voter_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('target_id')->constrained('users')->onDelete('cascade');
            $table->string('phase'); // 'day' o 'night'
            $table->integer('round');
            $table->timestamps();

            // Un jugador solo puede votar una vez por ronda/fase
            $table->unique(['game_id', 'voter_id', 'phase', 'round']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_votes');
    }
};
