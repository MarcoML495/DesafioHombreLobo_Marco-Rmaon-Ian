<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\GameController;
use App\Http\Controllers\API\AdminUserController;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

/*
Route::get('/nologin', function () {
    return response()->json(["success"=>false, "message" => "Unauthorised"],203);
}); */


Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);
Route::post('envia', [UserController::class,'enviar']);

Route::middleware('auth:sanctum')->group(function () {
    // Perfil de usuario
    Route::get('/user', [UserController::class, 'getProfile']);
    Route::put('/user', [UserController::class, 'updateProfile']);

    // Cambiar contraseña
    Route::post('/user/change-password', [UserController::class, 'changePassword']);

    // Avatar (opcional para futuro)
    Route::post('/user/avatar', [UserController::class, 'updateAvatar']);

    Route::post('/game/insert', [GameController::class, 'insertGame']);

    Route::prefix('admin')->group(function () {
        Route::get('/users', [AdminUserController::class, 'index']); // Listar todos los usuarios
        Route::post('/users', [AdminUserController::class, 'store']); // Crear un nuevo usuario
        Route::get('/users/{id}', [AdminUserController::class, 'show']); // Obtener un usuario por ID
        Route::put('/users/{id}', [AdminUserController::class, 'update']); // Actualizar un usuario
        Route::delete('/users/{id}', [AdminUserController::class, 'destroy']); // Eliminar un usuario
    });
    
});
