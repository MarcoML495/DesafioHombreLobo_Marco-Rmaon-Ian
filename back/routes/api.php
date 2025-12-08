<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\GameController;
use App\Http\Controllers\API\AdminUserController;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Broadcast;

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
    Route::post('/lobbies/{gameId}/chat', [GameController::class, 'sendMessage']);

    Route::post('/lobbies/{gameId}/start', [GameController::class, 'startGame']);
    Route::get('/games/{gameId}/player-status', [GameController::class, 'getPlayerStatus']);
    
    Broadcast::routes(['middleware' => ['auth:sanctum']]);

    
    Route::prefix('admin')->group(function () {
        Route::get('/users', [AdminUserController::class, 'index']); // Listar todos los usuarios
        Route::post('/users', [AdminUserController::class, 'store']); // Crear un nuevo usuario
        Route::get('/users/{id}', [AdminUserController::class, 'show']); // Obtener un usuario por ID
        Route::put('/users/{id}', [AdminUserController::class, 'update']); // Actualizar un usuario
        Route::delete('/users/{id}', [AdminUserController::class, 'destroy']); // Eliminar un usuario
        
    });

    // Listar lobbies disponibles
    Route::get('/lobbies', [GameController::class, 'getLobbies']);

    // Crear nueva partida
    Route::post('/games', [GameController::class, 'insertGame']);

    // Unirse a una partida
    Route::post('/lobbies/{gameId}/join', [GameController::class, 'joinLobby']);

    // Abandonar una partida
    Route::post('/lobbies/{gameId}/leave', [GameController::class, 'leaveLobby']);

    // Obtener partida activa del usuario
    Route::get('/my-active-game', [GameController::class, 'getActiveGame']);

    // Obtener jugadores en la sala de espera
    Route::get('/lobbies/{gameId}/players', [GameController::class, 'getLobbyPlayers']);

    // Buscar juego por ID
    Route::get('/games/{id}', [GameController::class, 'findGame']);

    // Obtener todos los juegos (quizás quieras restringir esto solo a admins)
    Route::get('/games', [GameController::class, 'getGames']);
});
