<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Crear un usuario Administrador
        User::factory()->create([
            'name' => 'admin',
            'email' => 'admin@lobos.com',
            'password' => Hash::make('1234abc.-'), 
            'role' => 'admin',  
        ]);

        // Crear un usuario normal para pruebas
        User::factory()->create([
            'name' => 'jugador',
            'email' => 'jugador@lobos.com',
            'password' => Hash::make('password'),
            'role' => 'user',
        ]);
    }
}