<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Game;
use App\Models\GamePlayer;
use App\Models\User;
use Illuminate\Support\Facades\Validator;

class GameController extends Controller
{
    /**
     * Obtener todos los juegos
     */
    public function getGames()
    {
        $games = Game::all();
        return response()->json($games, 200);
    }

    /**
     * Buscar juego por ID
     */
    public function findGame($id)
    {
        $game = Game::find($id);
        return response()->json($game, 200);
    }

    /**
     * Insertar nuevo juego
     */
    public function insertGame(Request $req)
    {
        $user = $req->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no autenticado'
            ], 401);
        }

        $game = new Game;
        $game->name = $req->get('name');
        $game->join_code = null;

        if ($req->get('publicGame') == false) {
            $game->join_code = $req->get('joinCode');
        }

        $game->created_by_user_id = $user->id;
        $game->status = 'lobby';
        $game->min_players = 15;
        $game->max_players = $req->get('maxPlayers');

        try {
            $game->save();

            // Agregar al creador como primer jugador
            GamePlayer::create([
                'game_id' => $game->id,
                'user_id' => $user->id,
                'status' => 'waiting',
            ]);

            $gameData = [
                'id' => $game->id,
                'name' => $game->name,
                'join_code' => $game->join_code,
                'created_by_user_id' => $game->created_by_user_id,
                'status' => $game->status,
                'min_players' => $game->min_players,
                'max_players' => $game->max_players,
                'current_players' => 1
            ];

            return response()->json([
                "success" => true,
                "data" => $gameData,
                "message" => "Partida creada correctamente"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear partida: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar lobbies disponibles
     * GET /api/lobbies
     */
    public function getLobbies(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            // Obtener lobbies en estado 'lobby' con información del creador y jugadores
            $lobbies = Game::where('status', 'lobby')
                ->with(['creator:id,name', 'players' => function($query) {
                    $query->whereIn('status', ['waiting', 'ready', 'playing']);
                }])
                ->get()
                ->map(function ($game) {
                    return [
                        'id' => $game->id,
                        'name' => $game->name,
                        'creator_name' => $game->creator ? $game->creator->name : 'Desconocido',
                        'is_public' => $game->isPublic(),
                        'requires_code' => !$game->isPublic(),
                        'status' => $game->status,
                        'current_players' => $game->currentPlayersCount(),
                        'max_players' => $game->max_players,
                        'min_players' => $game->min_players,
                        'is_full' => $game->isFull(),
                        'can_join' => $game->canJoin(),
                        'created_at' => $game->created_at->toDateTimeString(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $lobbies,
                'message' => 'Lobbies obtenidos correctamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener lobbies: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Unirse a un lobby
     * POST /api/lobbies/{gameId}/join
     */
    public function joinLobby(Request $request, $gameId)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            // Validar código si es necesario
            $validator = Validator::make($request->all(), [
                'join_code' => 'nullable|string|max:12'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            // Buscar la partida
            $game = Game::find($gameId);

            if (!$game) {
                return response()->json([
                    'success' => false,
                    'message' => 'Partida no encontrada'
                ], 404);
            }

            // Verificar que esté en lobby
            if (!$game->isLobby()) {
                return response()->json([
                    'success' => false,
                    'message' => 'La partida ya comenzó o terminó'
                ], 400);
            }

            // Verificar que no esté llena
            if ($game->isFull()) {
                return response()->json([
                    'success' => false,
                    'message' => 'La partida está llena'
                ], 400);
            }

            // Verificar código si es privada
            if (!$game->isPublic()) {
                $providedCode = $request->input('join_code');

                if (!$providedCode || $providedCode !== $game->join_code) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Código de acceso incorrecto'
                    ], 403);
                }
            }

            // Verificar que el usuario no esté ya en la partida
            if ($game->hasPlayer($user->id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ya estás en esta partida'
                ], 400);
            }

            // Unir al jugador
            $gamePlayer = GamePlayer::create([
                'game_id' => $game->id,
                'user_id' => $user->id,
                'status' => 'waiting',
            ]);

            return response()->json([
                'success' => true,
                'message' => '¡Te has unido a la partida!',
                'data' => [
                    'game_id' => $game->id,
                    'game_name' => $game->name,
                    'current_players' => $game->currentPlayersCount(),
                    'max_players' => $game->max_players
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al unirse: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Salir de un lobby
     * POST /api/lobbies/{gameId}/leave
     */
    public function leaveLobby(Request $request, $gameId)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            $game = Game::find($gameId);

            if (!$game) {
                return response()->json([
                    'success' => false,
                    'message' => 'Partida no encontrada'
                ], 404);
            }

            // Buscar al jugador en la partida
            $gamePlayer = GamePlayer::where('game_id', $gameId)
                ->where('user_id', $user->id)
                ->whereIn('status', ['waiting', 'ready'])
                ->first();

            if (!$gamePlayer) {
                return response()->json([
                    'success' => false,
                    'message' => 'No estás en esta partida'
                ], 404);
            }

            // Actualizar estado
            $gamePlayer->status = 'disconnected';
            $gamePlayer->left_at = now();
            $gamePlayer->save();

            return response()->json([
                'success' => true,
                'message' => 'Has salido de la partida'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al salir: ' . $e->getMessage()
            ], 500);
        }
    }
}
