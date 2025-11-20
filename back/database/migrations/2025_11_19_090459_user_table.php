<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {

            $table->uuid('id')->primary()->default(DB::raw('UUID()'));

            // Datos personales
            $table->string('name');
            $table->string('real_name')->nullable();
            $table->string('email')->unique();
            $table->string('password');
            $table->text('bio')->nullable();

            $table->uuid('avatar_image_id')->nullable();

            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();

            $table->timestamps();
        });

        // Foreign key del avatar
        // Schema::table('users', function (Blueprint $table) {
        //     $table->foreign('avatar_image_id')
        //         ->references('id')
        //         ->on('images')
        //         ->onDelete('set null');
        // });
    }

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
