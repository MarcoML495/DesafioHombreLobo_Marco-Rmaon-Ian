<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\GameController;
use App\Http\Controllers\API\AdminUserController;
use App\Http\Controllers\API\VoteController;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Broadcast;


Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);
Route::post('envia', [UserController::class, 'enviar']);

Route::middleware('auth:sanctum')->group(function () {
    // Perfil de usuario
    Route::get('/user', [UserController::class, 'getProfile']);
    Route::put('/user', [UserController::class, 'updateProfile']);
    Route::post('/user/change-password', [UserController::class, 'changePassword']);
    Route::post('/user/avatar', [UserController::class, 'updateAvatar']);

    // Broadcasting auth
    Broadcast::routes(['middleware' => ['auth:sanctum']]);

    // Admin routes
    Route::prefix('admin')->group(function () {
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::post('/users', [AdminUserController::class, 'store']);
        Route::get('/users/{id}', [AdminUserController::class, 'show']);
        Route::put('/users/{id}', [AdminUserController::class, 'update']);
        Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);
    });

    // Lobby routes
    Route::get('/lobbies', [GameController::class, 'getLobbies']);
    Route::post('/lobbies/{gameId}/join', [GameController::class, 'joinLobby']);
    Route::post('/lobbies/{gameId}/joinbots', [GameController::class, 'joinLobbyBots']);
    Route::post('/lobbies/{gameId}/leave', [GameController::class, 'leaveLobby']);
    Route::get('/lobbies/{gameId}/players', [GameController::class, 'getLobbyPlayers']);
    Route::post('/lobbies/{gameId}/chat', [GameController::class, 'sendMessage']);
    Route::post('/lobbies/{gameId}/start', [GameController::class, 'startGame']);

    // Game routes
    Route::get('/my-active-game', [GameController::class, 'getActiveGame']);
    Route::get('/games/{id}', [GameController::class, 'findGame']);
    Route::get('/games', [GameController::class, 'getGames']);
    Route::post('/games', [GameController::class, 'insertGame']);

    // GAME PHASE ROUTES (SISTEMA DÍA/NOCHE)
    Route::post('/games/{gameId}/change-phase', [GameController::class, 'changePhase']);

    Route::get('/games/{gameId}/phase', [GameController::class, 'getCurrentPhase']);
    Route::get('/games/{gameId}/player-status', [GameController::class, 'getPlayerStatus']);
    Route::post('/games/{gameId}/chat', [GameController::class, 'sendGameMessage']);

    Route::post('/games/{gameId}/vote', [VoteController::class, 'vote']);
    Route::get('/games/{gameId}/votes', [VoteController::class, 'getVotes']);

    Route::post('/games/{gameId}/disconnect', [GameController::class, 'handleDisconnect']);
});
