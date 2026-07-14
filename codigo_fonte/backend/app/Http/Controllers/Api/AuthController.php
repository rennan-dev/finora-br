<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create($request->validated());
        $token = $user->createToken('postman')->plainTextToken;

        return $this->tokenResponse('Usuário cadastrado com sucesso.', $user, $token, 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['As credenciais informadas são inválidas.'],
            ]);
        }

        if (Hash::needsRehash($user->password)) {
            $user->forceFill(['password' => $data['password']])->save();
        }

        $tokenName = $data['device_name'] ?? 'postman';
        $token = $user->createToken($tokenName)->plainTextToken;

        return $this->tokenResponse('Login realizado com sucesso.', $user, $token);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new UserResource($request->user()),
        ]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->fill($request->safe()->except('current_password'));
        $user->save();

        return response()->json([
            'message' => 'Usuário atualizado com sucesso.',
            'data' => new UserResource($user->refresh()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $currentAccessToken = $request->user()->currentAccessToken();

        if ($currentAccessToken && method_exists($currentAccessToken, 'delete')) {
            $currentAccessToken->delete();
        }

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();
        $request->user()->delete();

        return response()->json([
            'message' => 'Conta excluída com sucesso.',
        ]);
    }

    private function tokenResponse(string $message, User $user, string $token, int $status = 200): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'data' => [
                'user' => new UserResource($user),
                'token' => [
                    'type' => 'Bearer',
                    'plain_text_token' => $token,
                ],
            ],
        ], $status);
    }
}
