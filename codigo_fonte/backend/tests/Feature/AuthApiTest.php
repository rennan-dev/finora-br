<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_receive_token(): void
    {
        $response = $this->postJson('/api/register', [
            'username' => 'rennan_dev',
            'email' => 'rennan@example.com',
            'password' => 'SenhaForte@12345',
            'password_confirmation' => 'SenhaForte@12345',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Usuário cadastrado com sucesso.')
            ->assertJsonPath('data.user.username', 'rennan_dev')
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'username', 'email', 'created_at', 'updated_at'],
                    'token' => ['type', 'plain_text_token'],
                ],
            ]);

        $user = User::where('email', 'rennan@example.com')->firstOrFail();

        $this->assertTrue(Hash::check('SenhaForte@12345', $user->password));
    }

    public function test_user_can_login_and_receive_token(): void
    {
        User::factory()->create([
            'username' => 'rennan_dev',
            'email' => 'rennan@example.com',
            'password' => 'SenhaForte@12345',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'rennan@example.com',
            'password' => 'SenhaForte@12345',
            'device_name' => 'postman',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Login realizado com sucesso.')
            ->assertJsonPath('data.token.type', 'Bearer')
            ->assertJsonStructure(['data' => ['token' => ['plain_text_token']]]);
    }

    public function test_protected_routes_require_token(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
    }

    public function test_authenticated_user_can_read_update_and_logout(): void
    {
        $user = User::factory()->create([
            'username' => 'rennan_dev',
            'email' => 'rennan@example.com',
            'password' => 'SenhaForte@12345',
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'rennan@example.com')
            ->assertJsonMissing(['password']);

        $this->patchJson('/api/me', [
            'username' => 'rennan_api',
            'email' => 'rennan.api@example.com',
            'password' => 'OutraSenha@12345',
            'password_confirmation' => 'OutraSenha@12345',
            'current_password' => 'SenhaForte@12345',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Usuário atualizado com sucesso.')
            ->assertJsonPath('data.username', 'rennan_api');

        $this->postJson('/api/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logout realizado com sucesso.');
    }
}
