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
        Schema::create('game_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained('games')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['waiting', 'ready', 'playing', 'dead', 'disconnected'])->default('waiting');
            $table->string('role', 50)->nullable(); // Rol asignado en el juego
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamp('left_at')->nullable();

            // Un usuario no puede estar dos veces en la misma partida
            $table->unique(['game_id', 'user_id']);

            // Índices para búsquedas rápidas
            $table->index('game_id');
            $table->index('user_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_players');
    }
};
