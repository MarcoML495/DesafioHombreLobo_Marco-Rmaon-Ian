<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;


class AuthController extends Controller
{
    public function register(Request $request)
    {
        $input = $request->all();
        $rules = [
            'name' => 'required|string|max:20',
            'email' => 'required|email|max:255|unique:users',
            'password' => 'required|min:8',
            'confirm_password' => 'required|same:password',
        ];
        $messages = [
            'unique' => 'El :attribute ya está registrado en la base de datos.',
            'email' => 'El campo :attribute debe ser un correo electrónico válido.',
            'same' => 'El campo :attribute y :other deben coincidir.',
            'max' => 'El campo :attribute no debe exceder el tamaño máximo permitido.',
            'min' => 'El campo :attribute debe tener al menos :min caracteres.',
            'required' => 'El campo :attribute es obligatorio.'
        ];

        $validator = Validator::make($request->all(), $rules, $messages);
        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $input['password'] = bcrypt($input['password']);
        $user = User::create($input);

        $tokenResult = $user->createToken('LaravelSanctumAuth', ['usuario']);
        $tokenResult->accessToken->save();

        $success = [
            'id' => $user->id,
            'name' => $user->name,
            'token' => $tokenResult->plainTextToken, // ← NUEVO
            'expires_at' => $tokenResult->accessToken->expires_at == null ? null : $tokenResult->accessToken->expires_at->toDateTimeString()
        ];

        return response()->json([
            "success" => true,
            "data" => $success,
            "message" => "Usuario registrado correctamente"
        ]);
    }

   public function login(Request $request)
    {
        $input = $request->all();
        $rules = [
            'name' => 'required|string',
            'password' => 'required|min:8'
        ];
        $messages = [
            'max' => 'El campo :attribute no debe exceder el tamaño máximo permitido.',
            'min' => 'El campo :attribute debe tener al menos :min caracteres.',
            'required' => 'El campo :attribute es obligatorio.'
        ];

        $validator = Validator::make($input, $rules, $messages);
        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Bloque de inicio de sesión por EMAIL
        if (str_contains($request->name, '@') && str_contains($request->name, '.')) {
            if (Auth::attempt(['email' => $request->name, 'password' => $request->password])) {
                $auth = Auth::user();
                
                // LÓGICA DE ABILITIES DINÁMICA
                $abilities = ['usuario'];
                if ($auth->role === 'admin') {
                    $abilities[] = 'admin'; 
                }
                
                $tokenResult = $auth->createToken('LaravelSanctumAuth', $abilities); // CAMBIO: Uso de abilities dinámicas

                // Actualizar expiración (mantengo tu código comentado/existente)
                // $hours = (int) env('SANCTUM_EXPIRATION_HOURS', 2);
                // $tokenResult->accessToken->expires_at = now()->addHours($hours);
                $tokenResult->accessToken->save();

                $success = [
                    'id'         => $auth->id,
                    'name'       => $auth->name,
                    'token'      => $tokenResult->plainTextToken,
                    'expires_at' => $tokenResult->accessToken->expires_at == null ? null : $tokenResult->accessToken->expires_at->toDateTimeString()
                ];
                return response()->json(["success" => true, "data" => $success, "message" => "User logged-in!"]);
            } else {
                return response()->json(["success" => false, "message" => "Unauthorised"], 404);
            }
        } 
        
        // Bloque de inicio de sesión por NOMBRE DE USUARIO
        else {
            if (Auth::attempt(['name' => $request->name, 'password' => $request->password])) {
                $auth = Auth::user();
                
                // LÓGICA DE ABILITIES DINÁMICA
                $abilities = ['usuario'];
                if ($auth->role === 'admin') {
                    $abilities[] = 'admin';
                }
                
                $tokenResult = $auth->createToken('LaravelSanctumAuth', $abilities); // CAMBIO: Uso de abilities dinámicas

                // Actualizar expiración (mantengo tu código comentado/existente)
                // $hours = (int) env('SANCTUM_EXPIRATION_HOURS', 2);
                // $tokenResult->accessToken->expires_at = now()->addHours($hours);
                $tokenResult->accessToken->save();

                $success = [
                    'id'         => $auth->id,
                    'name'       => $auth->name,
                    'token'      => $tokenResult->plainTextToken,
                    'expires_at' => $tokenResult->accessToken->expires_at == null ? null : $tokenResult->accessToken->expires_at->toDateTimeString()
                ];
                return response()->json(["success" => true, "data" => $success, "message" => "User logged-in!"]);
            } else {
                return response()->json(["success" => false, "message" => "Unauthorised"], 404);
            }
        }
    }
}
