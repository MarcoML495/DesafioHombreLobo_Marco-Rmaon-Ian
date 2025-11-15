<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;   


class AuthController extends Controller{
    public function register(Request $request){
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
            'between' => 'El campo :attribute debe estar entre :min y :max años.',
            'in' => 'El campo :attribute debe ser uno de los siguientes valores: :values.',
            //'integer' => 'El campo :attribute debe ser un número entero.',
            'required' => 'El campo :attribute es obligatorio.'
        ];

        $validator = Validator::make($request->all(), $rules, $messages);
        if($validator->fails()){
            return response()->json($validator->errors(),422);
        }


        $input['password'] = bcrypt($input['password']);
        $user = User::create($input);

        //$tokenResult = $user->createToken('LaravelSanctumAuth');

        // Actualizar expiración
        // $hours = (int) env('SANCTUM_EXPIRATION_HOURS', 2);
        // $tokenResult->accessToken->expires_at = now()->addHours($hours);
        // $tokenResult->accessToken->save();

        $success = [
            'id' => $user->id,
            'name' => $user->name,
            //'token' => $user->createToken('LaravelSanctumAuth')->plainTextToken,
            //'expires_at' => $tokenResult->accessToken->expires_at ==null ? null:  $tokenResult->accessToken->expires_at->toDateTimeString()
        ];
        
        return response()->json(["success"=>true,"data"=>$success, "message" => "User successfully registered!"]);
    }

    public function login(Request $request)
    {

        $input = $request->all();
        $rules = [
            'name' => 'required|string|max:20',
            'password' => 'required|min:8'
        ];
        $messages = [
            'max' => 'El campo :attribute no debe exceder el tamaño máximo permitido.',
            'min' => 'El campo :attribute debe tener al menos :min caracteres.',
            'required' => 'El campo :attribute es obligatorio.'
        ];

        $validator = Validator::make($input, $rules, $messages);
        if($validator->fails()){
            return response()->json($validator->errors(),422);
        }


        if(Auth::attempt(['name' => $request->name, 'password' => $request->password])){
            $auth = Auth::user();
            // return $auth;
            //$tokenResult = $auth->createToken('LaravelSanctumAuth');
            $tokenResult = $auth->createToken('LaravelSanctumAuth',['usuario']); // Asignar abilities al token

            // Actualizar expiración
            // $hours = (int) env('SANCTUM_EXPIRATION_HOURS', 2);
            // $tokenResult->accessToken->expires_at = now()->addHours($hours);
            $tokenResult->accessToken->save();

            $success = [
                'id'         => $auth->id,
                'name'       => $auth->name,
                'token'      => $tokenResult->plainTextToken,
                'expires_at' => $tokenResult->accessToken->expires_at == null ? null :  $tokenResult->accessToken->expires_at->toDateTimeString()
            ];
            return response()->json(["success"=>true,"data"=>$success, "message" => "User logged-in!"]);
        }
        else{
            return response()->json(["success"=>false, "message" => "Unauthorised"],404);
        }
    }
}
