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
        Schema::table('games', function (Blueprint $table) {
            $table->string('current_phase')->default('day')->after('status'); // 'day' o 'night'
            $table->integer('current_round')->default(1)->after('current_phase');
            $table->timestamp('phase_started_at')->nullable()->after('current_round');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn(['current_phase', 'current_round', 'phase_started_at']);
        });
    }
};
