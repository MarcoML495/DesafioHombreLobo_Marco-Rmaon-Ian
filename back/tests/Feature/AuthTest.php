<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;

class AuthTest extends TestCase
{
    // ✅ Sección 8: "Usa RefreshDatabase para limpiar la BD entre tests"
    use RefreshDatabase;

    /**
     * Verifica que un usuario puede loguearse y consultar sus datos.
     * Naming convention (Sección 8): test_can_...
     */
    public function test_can_login_and_get_profile(){
        
        $password = 'password123';
        $user = User::factory()->create([
            'name'     => 'UsuarioTest',    
            'email'    => 'test@example.com',
            'password' => bcrypt($password),
        ]);

        $this->assertDatabaseHas('users', ['email' => 'test@example.com']);

        
        $response = $this->postJson('/api/login', [
            'name'     => 'UsuarioTest', 
            'password' => $password,
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'token',
                         'id',
                         'name'
                     ],
                     'message'
                 ]);

        $token = $response->json('data.token');

        
        $profileResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/user');

        
        $profileResponse->assertStatus(200)
                        ->assertJson([
                            'data' => [
                                'email' => 'test@example.com',
                                'name'  => 'UsuarioTest'
                            ]
                        ]);
    }
}