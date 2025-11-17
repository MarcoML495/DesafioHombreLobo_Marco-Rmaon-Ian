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
        Schema::create('users', function (Blueprint $table) {
            // UUID como clave primaria
            $table->uuid('id')->primary();

            // Datos básicos
            $table->string('name');
            $table->string('email')->unique();

            // Password (el campo del modelo es "password")
            $table->string('password');

            // Avatar opcional (ajusta tipo si tu tabla images usa UUID)
            $table->unsignedBigInteger('avatar_image_id')->nullable();

            // Último login
            $table->timestamp('last_login_at')->nullable();

            // Token "remember me"
            $table->rememberToken();

            // created_at / updated_at
            $table->timestamps();

            // FOREIGN KEY a images

            // $table->foreign('avatar_image_id')
            //     ->references('id')
            //     ->on('images')
            //     ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Primero quitamos la foreign
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['avatar_image_id']);
        });

        Schema::dropIfExists('users');
    }
};
