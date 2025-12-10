<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller{
    public function index(Request $request)
    {
        try {
            $users = User::select('id', 'name', 'email', 'role', 'real_name', 'created_at', 'last_login_at')
                         ->orderBy('created_at', 'desc')
                         ->get();

            return response()->json([
                'success' => true,
                'data' => $users,
                'message' => 'Lista de usuarios obtenida correctamente.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener usuarios: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role' => 'required|in:admin,user'
        ], [
            'email.unique' => '¡Ese correo ya está registrado!'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ], 422);
        }

        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'real_name' => $request->real_name,
                'bio' => $request->bio,
            ]);

            return response()->json([
                'success' => true,
                'data' => $user->only(['id', 'name', 'email', 'role']),
                'message' => 'Usuario creado correctamente.'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $user->only(['id', 'name', 'real_name', 'email', 'bio', 'role', 'avatar_image_id', 'created_at', 'last_login_at']),
            'message' => 'Usuario obtenido correctamente.'
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:20|min:3',
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'sometimes|string|min:8',
            'role' => ['sometimes', 'string', Rule::in(['user', 'admin'])],
            'real_name' => 'sometimes|nullable|string|max:255',
            'bio' => 'sometimes|nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            if ($request->has('name')) {
                $user->name = $request->name;
            }
            if ($request->has('email')) {
                $user->email = $request->email;
            }
            if ($request->has('password')) {
                $user->password = Hash::make($request->password);
            }
            if ($request->has('role')) {
                $user->role = $request->role;
            }
            if ($request->has('real_name')) {
                $user->real_name = $request->real_name;
            }
            if ($request->has('bio')) {
                $user->bio = $request->bio;
            }

            $user->save();

            return response()->json([
                'success' => true,
                'data' => $user->only(['id', 'name', 'email', 'role']),
                'message' => 'Usuario actualizado correctamente.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.'
            ], 404);
        }

        if ($user->id == auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes eliminar tu propia cuenta de administrador.'
            ], 403); 
        }

        try {
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'Usuario eliminado correctamente.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar usuario: ' . $e->getMessage()
            ], 500);
        }
    }
}