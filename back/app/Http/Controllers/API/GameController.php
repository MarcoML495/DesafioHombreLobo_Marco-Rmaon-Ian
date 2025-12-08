<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Game;
use App\Models\GamePlayer;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Events\LobbyMessage;
use App\Events\LobbyUpdated;

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
        $game->min_players = 2;
        $game->max_players = $req->get('maxPlayers');

        try {
            DB::transaction(function () use ($game, $user) {
                $game->save();

                // NUEVO: Desactivar partidas anteriores del usuario (excepto esta que estamos creando)
                GamePlayer::where('user_id', $user->id)
                    ->where('game_id', '!=', $game->id)
                    ->where('is_active', true)
                    ->update([
                        'is_active' => false,
                        'left_at' => now(),
                    ]);

                // Verificar si ya existe un registro del creador en esta partida
                $existingPlayer = GamePlayer::where('game_id', $game->id)
                    ->where('user_id', $user->id)
                    ->first();

                if ($existingPlayer) {
                    // Reactivar el registro existente
                    $existingPlayer->update([
                        'is_active' => true,
                        'status' => 'waiting',
                        'joined_at' => now(),
                        'left_at' => null,
                    ]);
                } else {
                    // Agregar al creador como primer jugador (ACTIVO)
                    GamePlayer::create([
                        'game_id' => $game->id,
                        'user_id' => $user->id,
                        'status' => 'waiting',
                        'is_active' => true,
                        'joined_at' => now(),
                    ]);
                }
            });

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

            // Obtener lobbies en estado 'lobby' con información del creador y jugadores ACTIVOS
            $lobbies = Game::where('status', 'lobby')
                ->with(['creator:id,name', 'players' => function($query) {
                    $query->where('is_active', true)
                          ->whereIn('status', ['waiting', 'ready', 'playing']);
                }])
                ->get()
                ->map(function ($game) {
                    return [
                        'id' => $game->id,
                        'name' => $game->name,
                        'creator_name' => $game->creator ? $game->creator->name : 'Desconocido',
                        'is_public' => $game->isPublic(),
                        'requires_code' => !$game->isPublic(),
                        'join_code' => !$game->isPublic() ? $game->join_code : null,
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
     *
     * IMPORTANTE: Solo permite estar en UNA partida activa a la vez
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

            // NUEVO: Verificar que el usuario no esté ya en esta partida ACTIVA
            $alreadyInGame = GamePlayer::where('game_id', $gameId)
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->exists();

            if ($alreadyInGame) {
                // Ya está en la partida, permitir reingreso
                return response()->json([
                    'success' => true,
                    'message' => 'Ya estás en esta partida. Redirigiendo...',
                    'data' => [
                        'game_id' => $game->id,
                        'game_name' => $game->name,
                        'current_players' => $game->currentPlayersCount(),
                        'max_players' => $game->max_players
                    ]
                ]);
            }

            // NUEVO: Desactivar todas las partidas activas del usuario y unirse a la nueva
            DB::transaction(function () use ($user, $game) {
                LobbyUpdated::dispatch($game->id, 'join');
                // Desactivar cualquier partida activa previa (excepto esta)
                GamePlayer::where('user_id', $user->id)
                    ->where('game_id', '!=', $game->id)
                    ->where('is_active', true)
                    ->update([
                        'is_active' => false,
                        'status' => 'disconnected',
                        'left_at' => now(),
                    ]);

                // Verificar si ya existe un registro para este usuario en esta partida
                $existingPlayer = GamePlayer::where('game_id', $game->id)
                    ->where('user_id', $user->id)
                    ->first();

                if ($existingPlayer) {
                    // Reactivar el registro existente
                    $existingPlayer->update([
                        'is_active' => true,
                        'status' => 'waiting',
                        'joined_at' => now(),
                        'left_at' => null,
                    ]);
                } else {
                    // Crear nuevo registro
                    GamePlayer::create([
                        'game_id' => $game->id,
                        'user_id' => $user->id,
                        'status' => 'waiting',
                        'is_active' => true,
                        'joined_at' => now(),
                    ]);
                }
            });

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

    public function joinLobbyBots(Request $request, $gameId)
    {
        try {
            // Buscar la partida
            $game = Game::find($gameId);

            if (!$game) {
                return response()->json(['success' => false, 'message' => 'Partida no encontrada'], 404);
            }

            // Verificar que esté en lobby
            if (!$game->isLobby()) {
                return response()->json(['success' => false,'message' => 'La partida ya comenzó o terminó'], 400);
            }

            // Verificar que no esté llena
            if ($game->isFull()) {
                return response()->json(['success' => false,'message' => 'La partida está llena'], 400);
            }

            // Coger a todos los bots y meterlos en la partida
            $bots = User::where('role', '=', 'bot')->get();

            if (count($bots)<=0) {
                return response()->json(['success' => false,'message' => 'No hay bots en la BD'], 400);
            }

            foreach ($bots as $bot) {
                DB::transaction(function () use ($bot, $game) {
                    LobbyUpdated::dispatch($game->id, 'join');
                    GamePlayer::create([
                            'game_id' => $game->id,
                            'user_id' => $bot->id,
                            'status' => 'waiting',
                            'is_active' => true,
                            'joined_at' => now(),
                    ]);
                });
            }

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

            // Buscar al jugador en la partida ACTIVA
            $gamePlayer = GamePlayer::where('game_id', $gameId)
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->whereIn('status', ['waiting', 'ready'])
                ->first();

            if (!$gamePlayer) {
                return response()->json([
                    'success' => false,
                    'message' => 'No estás en esta partida'
                ], 404);
            }

            // Desactivar y actualizar estado
            $gamePlayer->is_active = false;
            $gamePlayer->status = 'disconnected';
            $gamePlayer->left_at = now();
            $gamePlayer->save();
            LobbyUpdated::dispatch($gameId, 'leave');

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

    /**
     * Obtener la partida activa del usuario
     * GET /api/my-active-game
     */
    public function getActiveGame(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            $gamePlayer = GamePlayer::with(['game'])
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->whereIn('status', ['waiting', 'ready', 'playing'])
                ->first();

            if (!$gamePlayer) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => 'No estás en ninguna partida activa.'
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'game_id' => $gamePlayer->game->id,
                    'game_name' => $gamePlayer->game->name,
                    'status' => $gamePlayer->status,
                    'role' => $gamePlayer->role,
                    'current_players' => $gamePlayer->game->currentPlayersCount(),
                    'max_players' => $gamePlayer->game->max_players,
                    'game_status' => $gamePlayer->game->status,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener partida activa: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener jugadores en la sala de espera
     * GET /api/lobbies/{gameId}/players
     */
    public function getLobbyPlayers(Request $request, $gameId)
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

            // Verificar que el usuario esté en la partida ACTIVA
            $isInGame = GamePlayer::where('game_id', $gameId)
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->exists();

            if (!$isInGame) {
                return response()->json([
                    'success' => false,
                    'message' => 'No estás en esta partida.'
                ], 403);
            }

            // Obtener todos los jugadores ACTIVOS
            $players = GamePlayer::with(['user:id,name'])
                ->where('game_id', $gameId)
                ->where('is_active', true)
                ->whereIn('status', ['waiting', 'ready', 'playing'])
                ->orderBy('joined_at', 'asc')
                ->get()
                ->map(function ($player) use ($game) {
                    return [
                        'id' => $player->user->id,
                        'name' => $player->user->name,
                        'avatar' => null, // Avatar no disponible por ahora
                        'status' => $player->status,
                        'is_creator' => $player->user_id === $game->created_by_user_id,
                        'joined_at' => $player->joined_at->diffForHumans(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'game' => [
                        'id' => $game->id,
                        'name' => $game->name,
                        'current_players' => $players->count(),
                        'max_players' => $game->max_players,
                        'min_players' => $game->min_players,
                        'can_start' => $players->count() >= $game->min_players,
                        'status' => $game->status,
                        'is_public' => $game->isPublic(),
                        'join_code' => !$game->isPublic() ? $game->join_code : null,
                    ],
                    'players' => $players,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener jugadores: ' . $e->getMessage()
            ], 500);
        }
    }
    public function sendMessage(Request $request, $gameId)
    {
        $user = $request->user();
        
        
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        
        $isInGame = GamePlayer::where('game_id', $gameId)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->exists();

        if (!$isInGame) {
            return response()->json(['success' => false, 'message' => 'No estás en esta partida'], 403);
        }

        
        LobbyMessage::dispatch($gameId, $user, $request->input('message'));

        return response()->json(['success' => true]);
    }

  

public function startGame(Request $request, $gameId)
    {
        $user = $request->user();
        $game = Game::find($gameId);

        if (!$game) {
            return response()->json(['success' => false, 'message' => 'Partida no encontrada'], 404);
        }

        
        if ($game->created_by_user_id != $user->id) {
            return response()->json(['success' => false, 'message' => 'Solo el creador puede iniciar la partida'], 403);
        }

        
        
        
        $players = $game->players()->where('is_active', true)->get();
        $count = $players->count();

        
        $numLobos = ($count === 2) ? 1 : max(1, floor($count / 4));
        
        
        $roles = [];
        for ($i = 0; $i < $numLobos; $i++) {
            $roles[] = 'lobo';
        }
        
        while (count($roles) < $count) {
            $roles[] = 'aldeano';
        }

        shuffle($roles);

        foreach ($players as $index => $player) {
            $player->role = $roles[$index];
            $player->save(); 
        }

        
        $game->status = 'in_progress';
        $game->save();

    
        LobbyUpdated::dispatch($game->id, 'in_progress');

        return response()->json(['success' => true, 'message' => 'Roles repartidos y partida iniciada']);
    }

    public function getPlayerStatus(Request $request, $gameId)
    {
        $user = $request->user();

        
        $player = GamePlayer::where('game_id', $gameId)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$player) {
            return response()->json([
                'success' => false,
                'message' => 'No estás jugando en esta partida.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $player->role ?? 'aldeano', 
                'is_alive' => $player->status !== 'dead',
                'status' => $player->status
            ]
        ]);
    }
}
