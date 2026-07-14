<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\PaymentMethod>
 */
class PaymentMethodFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->company().' '.fake()->randomElement(['Conta', 'Cartão']),
            'balance' => 0,
            'is_favorite' => false,
            'is_active' => true,
        ];
    }
}
