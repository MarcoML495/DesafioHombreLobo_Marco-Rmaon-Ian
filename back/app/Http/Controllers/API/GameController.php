<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Controllers\API\VoteController;
use Illuminate\Http\Request;
use App\Models\Game;
use App\Models\GamePlayer;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Events\LobbyMessage;
use App\Events\LobbyUpdated;
use App\Events\GamePhaseChanged;

class GameController extends Controller
{
    /**
     * Hace que los bots realizen sus acciones
     */
    function botActions($gameId)
    {
        //Mensajes que pondran los bots en el chat
        $daymessages = [
            "Yo creo que es %s",
            "%s sus",
            "Sospecho de %s",
            "No se vosotros, pero yo voto a %s",
            "Me cae mal %s, se lleva mi voto",
        ];
        $nightmessages = [
            "%s a la barbacoa...",
            "¿Camarero? Me pido a %s para llevar",
            "%s tiene una pinta apetitosa...",
            "%s sabe demasiado",
            "%s se cree que puede detenernos...",
        ];

        $game = Game::where('id', $gameId)->lockForUpdate()->first();

        //Comprueba que la partida es valida
        if (!$game) {
            return response()->json(['success' => false, 'message' => 'Partida no encontrada'], 404);
        }

        //Comprueba la fase del dia. De dia votan todos, de noche solo los lobos
        if ($game->current_phase === 'day') {
            //Cogemos a todos los bots activos
            $bots = GamePlayer::where('game_id', $gameId)
                ->where('is_active', true)
                ->where('status', 'playing')
                ->where('is_bot', true)
                ->get();

            //Si no hay bots no hacemos nada
            if (count($bots)<=0) {
                return;
            }

            foreach ($bots as $bot) {
                //Lista a todos los jugadores activos excepto el mismo bot como objetivo
                $targets = GamePlayer::where('game_id', $gameId)
                    ->where('user_id', '!=', $bot->user_id)
                    ->where('is_active', true)
                    ->where('status', 'playing')
                    ->get();
                
                if (count($targets)>0) {
                    //Selecciona uno de los posibles objetivos al azar
                    $target = $targets[rand(0,(count($targets)-1))];

                    //Realiza su voto
                    app('App\Http\Controllers\API\VoteController')->voteBot($gameId,$bot->user_id,$target->user_id);

                    //Coloca el mensaje en el chat
                    $botuser = User::find($bot->user_id);
                    $targetuser = User::find($target->user_id);
                    $message = sprintf($daymessages[rand(0,4)],$targetuser->name);
                    LobbyMessage::dispatch($gameId, $botuser, $message);
                }
            }

            return response()->json(['success' => true, 'message' => 'Los bots han actuado'], 200);

        } else if ($game->current_phase === 'night') {
            //Cogemos a todos los lobos bots activos
            $bots = GamePlayer::where('game_id', $gameId)
                ->where('is_active', true)
                ->where('status', 'playing')
                ->where('role', 'lobo')
                ->where('is_bot', true)
                ->get();

            //Si no hay bots no hacemos nada
            if (count($bots)<=0) {
                return;
            }

            //Lista a todos los no-lobos como objetivos
            $targets = GamePlayer::where('game_id', $gameId)
                ->where('is_active', true)
                ->where('status', 'playing')
                ->where('role', '!=', 'lobo')
                ->get();
            
            

            if (count($targets)>0) {
                //Selecciona uno de los posibles objetivos al azar
                $target = $targets[rand(0,(count($targets)-1))];

                //Hace que todos los bots voten al mismo objetivo
                foreach ($bots as $bot) {
                    //Realiza su voto
                    app('App\Http\Controllers\API\VoteController')->voteBot($gameId,$bot->user_id,$target->user_id);

                    //Coloca el mensaje en el chat
                    $botuser = User::find($bot->user_id);
                    $targetuser = User::find($target->user_id);
                    $message = sprintf($nightmessages[rand(0,4)],$targetuser->name);
                    LobbyMessage::dispatch($gameId, $botuser, $message);
                }
            }

            return response()->json(['success' => true, 'message' => 'Los bots han actuado'], 200);
        }
    }
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
                ->with(['creator:id,name', 'players' => function ($query) {
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
            $numbots = 15-($game->currentPlayersCount());

            if (count($bots)<$numbots) {
                return response()->json(['success' => false,'message' => 'No hay suficientes bots en la BD'], 400);
            }

            for ($i=0; $i < $numbots; $i++) { 
                $bot = $bots[$i];
                DB::transaction(function () use ($bot, $game) {
                    LobbyUpdated::dispatch($game->id, 'join');
                    GamePlayer::create([
                            'game_id' => $game->id,
                            'user_id' => $bot->id,
                            'status' => 'waiting',
                            'is_active' => true,
                            'is_bot' => true,
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

        // Asignar roles
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
            $player->status = 'playing'; // Cambiar status a playing
            $player->save();
        }

        // Inicializar sistema de fases
        $game->status = 'in_progress';
        $game->current_phase = 'day';
        $game->current_round = 1;
        $game->phase_started_at = now();
        $game->save();

        // Notificar cambio de estado
        LobbyUpdated::dispatch($game->id, 'in_progress');
        $this->botActions($gameId);

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

    /**
     * Obtener fase actual del juego
     * GET /api/games/{gameId}/phase
     */
    public function getCurrentPhase(Request $request, $gameId)
    {
        try {
            $user = $request->user();
            $game = Game::find($gameId);

            if (!$game) {
                return response()->json([
                    'success' => false,
                    'message' => 'Partida no encontrada'
                ], 404);
            }

            // Verificar que el usuario esté en la partida
            $isInGame = GamePlayer::where('game_id', $gameId)
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->exists();

            if (!$isInGame) {
                return response()->json([
                    'success' => false,
                    'message' => 'No estás en esta partida'
                ], 403);
            }

            // Calcular tiempo restante
            $phaseDuration = ($game->current_phase === 'night') ? 120 : 180; // 2 min noche, 3 min día

            // Asegurarse de que phase_started_at sea un objeto Carbon
            $startedAt = $game->phase_started_at ? \Carbon\Carbon::parse($game->phase_started_at) : now();

            $elapsed = now()->diffInSeconds($startedAt);
            $timeRemaining = max(0, $phaseDuration - $elapsed);

            return response()->json([
                'success' => true,
                'data' => [
                    'phase' => $game->current_phase ?? 'day',
                    'round' => $game->current_round ?? 1,
                    'time_remaining' => $timeRemaining,
                    'started_at' => $startedAt->toIso8601String()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener fase: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Enviar mensaje de chat en el juego
     * POST /api/games/{gameId}/chat
     */
    public function sendGameMessage(Request $request, $gameId)
    {
        $user = $request->user();
        $game = Game::find($gameId);

        if (!$game) {
            return response()->json(['success' => false, 'message' => 'Partida no encontrada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $player = GamePlayer::where('game_id', $gameId)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$player) {
            return response()->json(['success' => false, 'message' => 'No estás en esta partida'], 403);
        }

        // Si es de noche, solo lobos pueden escribir
        if ($game->current_phase === 'night' && $player->role !== 'lobo') {
            return response()->json(['success' => false, 'message' => 'Solo los lobos hablan de noche'], 403);
        }

        // Usar el mismo evento del lobby para chat
        LobbyMessage::dispatch($gameId, $user, $request->input('message'));

        return response()->json(['success' => true]);
    }

    /**
     * Cambiar fase manualmente
     * POST /api/games/{gameId}/change-phase
     */
    public function changePhase(Request $request, $gameId)
    {
        $user = $request->user();

        return DB::transaction(function () use ($user, $gameId) {
            // Lock para evitar race conditions
            $game = Game::where('id', $gameId)->lockForUpdate()->first();

            if (!$game) {
                return response()->json(['success' => false, 'message' => 'Partida no encontrada'], 404);
            }

            // Verificar que el usuario esté en la partida
            $isInGame = GamePlayer::where('game_id', $gameId)
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->exists();

            if (!$isInGame) {
                return response()->json(['success' => false, 'message' => 'No estás en esta partida'], 403);
            }

            // Calcular si realmente debe cambiar fase
            $phaseDuration = $game->current_phase === 'night' ? 120 : 180;
            $now = now();
            $phaseStart = \Carbon\Carbon::parse($game->phase_started_at);
            $timeSincePhaseStart = abs($now->diffInSeconds($phaseStart));
            $timeRemaining = max(0, $phaseDuration - $timeSincePhaseStart);

            \Log::info("📊 Phase change request", [
                'game_id' => $gameId,
                'user_id' => $user->id,
                'current_phase' => $game->current_phase,
                'current_round' => $game->current_round,
                'now' => $now->toDateTimeString(),
                'phase_started_at' => $phaseStart->toDateTimeString(),
                'elapsed_seconds' => $timeSincePhaseStart,
                'required_duration' => $phaseDuration,
                'time_remaining' => $timeRemaining
            ]);

            // Si aún queda tiempo según el backend, no cambiar
            if ($timeRemaining > 1) { // pequeña tolerancia de 1s para compensar desfases
                \Log::info("⏱️ Too early to change phase");
                return response()->json([
                    'success' => false,
                    'message' => 'Fase aún no debe cambiar',
                    'time_remaining' => $timeRemaining,
                    'phase' => $game->current_phase,
                    'round' => $game->current_round,
                    'started_at' => $game->phase_started_at
                ]);
            }

            // Cambiar fase
            $newPhase = $game->current_phase === 'day' ? 'night' : 'day';
            $newRound = $game->current_round;

            // Si vuelve a ser día, incrementar ronda
            if ($newPhase === 'day') {
                $newRound++;
            }

            \Log::info("✅ Changing phase", [
                'old_phase' => $game->current_phase,
                'new_phase' => $newPhase,
                'old_round' => $game->current_round,
                'new_round' => $newRound
            ]);

            $game->current_phase = $newPhase;
            $game->current_round = $newRound;
            $game->phase_started_at = now();
            $game->save();

            $newPhaseDuration = $newPhase === 'day' ? 180 : 120;

            // Broadcast a todos
            broadcast(new GamePhaseChanged($game->id, [
                'phase' => $newPhase,
                'round' => $newRound,
                'time_remaining' => $newPhaseDuration,
                'started_at' => now()->toIso8601String()
            ]));

            $this->botActions($gameId);

            return response()->json([
                'success' => true,
                'data' => [
                    'phase' => $newPhase,
                    'round' => $newRound,
                    'time_remaining' => $newPhaseDuration,
                    'started_at' => now()->toIso8601String()
                ]
            ]);
        });
    }
}
