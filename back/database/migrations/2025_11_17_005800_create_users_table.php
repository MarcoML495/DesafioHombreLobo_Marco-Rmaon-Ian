<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            
            $table->uuid('id')->primary()->default(DB::raw('UUID()'));

            // Datos básicos
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');

            // Si 'images.id' es UUID, usa uuid también aquí
            $table->uuid('avatar_image_id')->nullable();

            // Último login
            $table->timestamp('last_login_at')->nullable();

            // Token "remember me"
            $table->rememberToken();

            // created_at / updated_at
            $table->timestamps();
        });

        // Si tu tabla images usa UUID en id, añade la foreign:
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('avatar_image_id')
                ->references('id')
                ->on('images')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'avatar_image_id')) {
                $table->dropForeign(['avatar_image_id']);
            }
        });

        Schema::dropIfExists('users');
    }
};
