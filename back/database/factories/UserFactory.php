<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->userName(), 
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('1234abc.-'),
            'role' => 'user', 
        ];
    }
   
    public function admin(): Factory{
        return $this->state(fn (array $attributes) => [
            'role' => 'admin',
        ]);
    }

    public function bot(): Factory{
        return $this->state(fn (array $attributes) => [
            'name' => 'Bot-'.fake()->unique()->firstName(),
            'role' => 'bot', 
        ]);
    }
}