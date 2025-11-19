<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Obtener el perfil del usuario autenticado
     * GET /api/user
     */
    public function getProfile(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'real_name' => $user->real_name,
                'email' => $user->email,
                'bio' => $user->bio ?? '',
                'avatar_image_id' => $user->avatar_image_id,
                'created_at' => $user->created_at,
                'last_login_at' => $user->last_login_at
            ];

            return response()->json([
                'success' => true,
                'data' => $userData,
                'message' => 'Perfil obtenido correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el perfil: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar el perfil del usuario autenticado
     * PUT /api/user
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            // Validación
            $rules = [
                'name' => 'sometimes|string|max:20|min:3',
                'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
                'bio' => 'sometimes|string|max:500|nullable'
            ];

            $messages = [
                'name.min' => 'El nombre debe tener al menos 3 caracteres.',
                'name.max' => 'El nombre no debe exceder los 20 caracteres.',
                'email.email' => 'El correo electrónico debe ser válido.',
                'email.unique' => 'Este correo electrónico ya está en uso.',
                'bio.max' => 'La biografía no debe exceder los 500 caracteres.'
            ];

            $validator = Validator::make($request->all(), $rules, $messages);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            // Actualizar solo los campos enviados
            if ($request->has('name')) {
                $user->name = $request->name;
            }

            if ($request->has('email')) {
                $user->email = $request->email;
            }

            if ($request->has('bio')) {
                $user->bio = $request->bio;
            }

            if ($request->has('real_name')) {
                $user->real_name = $request->real_name;
            }


            $user->save();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'bio' => $user->bio
                ],
                'message' => 'Perfil actualizado correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el perfil: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cambiar la contraseña del usuario autenticado
     * POST /api/user/change-password
     */
    public function changePassword(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            // Validación
            $rules = [
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8',
                'confirm_password' => 'required|string|same:new_password'
            ];

            $messages = [
                'current_password.required' => 'La contraseña actual es obligatoria.',
                'new_password.required' => 'La nueva contraseña es obligatoria.',
                'new_password.min' => 'La nueva contraseña debe tener al menos 8 caracteres.',
                'confirm_password.required' => 'Debes confirmar la nueva contraseña.',
                'confirm_password.same' => 'Las contraseñas no coinciden.'
            ];

            $validator = Validator::make($request->all(), $rules, $messages);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verificar que la contraseña actual sea correcta
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La contraseña actual es incorrecta.'
                ], 422);
            }

            // Validar carácter especial en la nueva contraseña
            if (!preg_match('/[!@#$%^&*()_\-+={}[\]|\\:;"\'<>,.?\/~`]/', $request->new_password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La nueva contraseña debe contener al menos un carácter especial.'
                ], 422);
            }

            // Actualizar la contraseña
            $user->password = Hash::make($request->new_password);
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Contraseña actualizada correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar la contraseña: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar el avatar del usuario (para futuro)
     * POST /api/user/avatar
     */
    public function updateAvatar(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            $rules = [
                'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048'
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'Avatar actualizado correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el avatar: ' . $e->getMessage()
            ], 500);
        }
    }
}
