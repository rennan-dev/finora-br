<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'username' => is_string($this->username) ? trim($this->username) : $this->username,
            'email' => is_string($this->email) ? strtolower(trim($this->email)) : $this->email,
        ]);
    }

    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'username' => ['sometimes', 'required', 'string', 'min:3', 'max:50', 'regex:/^[A-Za-z0-9_-]+$/', Rule::unique('users', 'username')->ignore($userId)],
            'email' => ['sometimes', 'required', 'string', 'email:rfc', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'password' => ['sometimes', 'required', 'string', 'confirmed', Password::min(12)->mixedCase()->numbers()->symbols()],
            'current_password' => ['nullable', 'required_with:password', 'current_password'],
        ];
    }

    public function messages(): array
    {
        return [
            'username.regex' => 'O username deve conter apenas letras, números, hífen e underline.',
            'password.confirmed' => 'A confirmação da senha não confere.',
        ];
    }
}
