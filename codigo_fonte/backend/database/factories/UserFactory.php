<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'username' => fake()->unique()->userName(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('SenhaForte@12345'),
        ];
    }

    public function withStrongPassword(string $password = 'SenhaForte@12345'): static
    {
        return $this->state(fn (array $attributes) => [
            'password' => $password,
        ]);
    }
}
