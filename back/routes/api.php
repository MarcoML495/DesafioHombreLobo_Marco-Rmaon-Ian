<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\GameController;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

/*
Route::get('/nologin', function () {
    return response()->json(["success"=>false, "message" => "Unauthorised"],203);
}); */


Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);
Route::post('envia', [UserController::class, 'enviar']);

Route::middleware('auth:sanctum')->group(function () {
    // Perfil de usuario
    Route::get('/user', [UserController::class, 'getProfile']);
    Route::put('/user', [UserController::class, 'updateProfile']);

    // Cambiar contraseña
    Route::post('/user/change-password', [UserController::class, 'changePassword']);

    // Avatar (opcional para futuro)
    Route::post('/user/avatar', [UserController::class, 'updateAvatar']);

    Route::post('/game/insert', [GameController::class, 'insertGame']);

    Route::get('/lobbies', [GameController::class, 'getLobbies']);
    Route::post('/lobbies/{gameId}/join', [GameController::class, 'joinLobby']);
    Route::post('/lobbies/{gameId}/leave', [GameController::class, 'leaveLobby']);
});
