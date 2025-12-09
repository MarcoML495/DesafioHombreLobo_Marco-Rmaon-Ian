<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Game;
use App\Models\GamePlayer;
use App\Models\GameVote;
use App\Events\PlayerEliminated;
use App\Events\GameFinished;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class VoteController extends Controller
{
    /**
     * Registrar voto
     * POST /api/games/{gameId}/vote
     */
    public function vote(Request $request, $gameId)
    {
        $validator = Validator::make($request->all(), [
            'target_id' => 'required|integer|exists:users,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $game = Game::find($gameId);

        if (!$game || $game->status !== 'in_progress') {
            return response()->json(['success' => false, 'message' => 'Partida no válida'], 404);
        }

        // Verificar que el votante esté en la partida y vivo
        $voter = GamePlayer::where('game_id', $gameId)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->where('status', 'playing')
            ->first();

        if (!$voter) {
            return response()->json(['success' => false, 'message' => 'No puedes votar'], 403);
        }

        // Verificar que el objetivo esté en la partida y vivo
        $target = GamePlayer::where('game_id', $gameId)
            ->where('user_id', $request->target_id)
            ->where('is_active', true)
            ->where('status', 'playing')
            ->first();

        if (!$target) {
            return response()->json(['success' => false, 'message' => 'Objetivo no válido'], 400);
        }

        // Validación según fase
        if ($game->current_phase === 'night') {
            // Solo lobos pueden votar de noche
            if ($voter->role !== 'lobo') {
                return response()->json(['success' => false, 'message' => 'Solo los lobos votan de noche'], 403);
            }

            // No pueden votar a otros lobos
            if ($target->role === 'lobo') {
                return response()->json(['success' => false, 'message' => 'No puedes votar a otro lobo'], 400);
            }
        }

        // Registrar o actualizar voto
        GameVote::updateOrCreate(
            [
                'game_id' => $gameId,
                'voter_id' => $user->id,
                'phase' => $game->current_phase,
                'round' => $game->current_round
            ],
            [
                'target_id' => $request->target_id
            ]
        );

        // Verificar si todos votaron
        $this->checkVotingComplete($game);

        return response()->json([
            'success' => true,
            'message' => 'Voto registrado'
        ]);
    }

    /**
     * Obtener votos actuales
     * GET /api/games/{gameId}/votes
     */
    public function getVotes(Request $request, $gameId)
    {
        $user = $request->user();
        $game = Game::find($gameId);

        if (!$game) {
            return response()->json(['success' => false, 'message' => 'Partida no encontrada'], 404);
        }

        $player = GamePlayer::where('game_id', $gameId)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$player) {
            return response()->json(['success' => false, 'message' => 'No estás en esta partida'], 403);
        }

        $votes = GameVote::where('game_id', $gameId)
            ->where('phase', $game->current_phase)
            ->where('round', $game->current_round)
            ->with(['voter:id,name', 'target:id,name'])
            ->get();

        // Filtrar votos según rol
        if ($game->current_phase === 'night' && $player->role !== 'lobo') {
            // Los no-lobos no ven votos de noche
            $votes = collect();
        }

        // Contar quién ha votado
        $eligibleVoters = $this->getEligibleVoters($game);
        $votedCount = $votes->pluck('voter_id')->unique()->count();
        $totalVoters = $eligibleVoters->count();

        return response()->json([
            'success' => true,
            'data' => [
                'votes' => $votes,
                'voted_count' => $votedCount,
                'total_voters' => $totalVoters,
                'all_voted' => $votedCount === $totalVoters,
                'my_vote' => $votes->where('voter_id', $user->id)->first()
            ]
        ]);
    }

    /**
     * Verificar si todos votaron y ejecutar resultado
     */
    private function checkVotingComplete(Game $game)
    {
        $eligibleVoters = $this->getEligibleVoters($game);

        $votes = GameVote::where('game_id', $game->id)
            ->where('phase', $game->current_phase)
            ->where('round', $game->current_round)
            ->get();

        $votedCount = $votes->pluck('voter_id')->unique()->count();

        if ($votedCount === $eligibleVoters->count()) {
            $this->executeVoteResult($game, $votes);
        }
    }

    /**
     * Obtener votantes elegibles
     */
    private function getEligibleVoters(Game $game)
    {
        $query = GamePlayer::where('game_id', $game->id)
            ->where('is_active', true)
            ->where('status', 'playing');

        if ($game->current_phase === 'night') {
            $query->where('role', 'lobo');
        }

        return $query->get();
    }

    /**
     * Ejecutar resultado de votación
     */
    private function executeVoteResult(Game $game, $votes)
    {
        // Contar votos por objetivo
        $voteCounts = $votes->groupBy('target_id')
            ->map(fn($group) => $group->count())
            ->sortDesc();

        if ($voteCounts->isEmpty()) {
            return;
        }

        // Obtener el más votado
        $eliminatedId = $voteCounts->keys()->first();

        // Marcar como muerto
        $eliminated = GamePlayer::where('game_id', $game->id)
            ->where('user_id', $eliminatedId)
            ->first();

        if ($eliminated) {
            $eliminated->update(['status' => 'dead']);

            // Broadcast evento de eliminación
            broadcast(new \App\Events\PlayerEliminated($game->id, [
                'player_id' => $eliminatedId,
                'player_name' => $eliminated->user->name,
                'phase' => $game->current_phase,
                'round' => $game->current_round
            ]));
        }

        // Verificar condición de victoria
        $this->checkWinCondition($game);
    }

    /**
     * Verificar condición de victoria
     */
    private function checkWinCondition(Game $game)
    {
        $alivePlayers = GamePlayer::where('game_id', $game->id)
            ->where('is_active', true)
            ->where('status', 'playing')
            ->get();

        $aliveWolves = $alivePlayers->where('role', 'lobo')->count();
        $aliveVillagers = $alivePlayers->where('role', '!=', 'lobo')->count();

        $winner = null;

        if ($aliveWolves === 0) {
            $winner = 'villagers';
        } elseif ($aliveWolves >= $aliveVillagers) {
            $winner = 'wolves';
        }

        if ($winner) {
            $game->update(['status' => 'finished']);

            broadcast(new \App\Events\GameFinished($game->id, [
                'winner' => $winner,
                'alive_players' => $alivePlayers->map(fn($p) => [
                    'id' => $p->user_id,
                    'name' => $p->user->name,
                    'role' => $p->role
                ])
            ]));
        }
    }

    /**
    * Variacion de la funcion de votar hecha solo para bots
    */
    public function voteBot($gameId, $botId, $targetId)
    {
        $game = Game::find($gameId);

        if (!$game || $game->status !== 'in_progress') {
            return response()->json(['success' => false, 'message' => 'Partida no válida'], 404);
        }

        // Verificar que el votante esté en la partida y vivo
        $voter = GamePlayer::where('game_id', $gameId)
            ->where('user_id', $botId)
            ->where('is_active', true)
            ->where('status', 'playing')
            ->first();

        if (!$voter) {
            return response()->json(['success' => false, 'message' => 'No puedes votar'], 403);
        }

        // Verificar que el objetivo esté en la partida y vivo
        $target = GamePlayer::where('game_id', $gameId)
            ->where('user_id', $targetId)
            ->where('is_active', true)
            ->where('status', 'playing')
            ->first();

        if (!$target) {
            return response()->json(['success' => false, 'message' => 'Objetivo no válido'], 400);
        }

        // Validación según fase
        if ($game->current_phase === 'night') {
            // Solo lobos pueden votar de noche
            if ($voter->role !== 'lobo') {
                return response()->json(['success' => false, 'message' => 'Solo los lobos votan de noche'], 403);
            }

            // No pueden votar a otros lobos
            if ($target->role === 'lobo') {
                return response()->json(['success' => false, 'message' => 'No puedes votar a otro lobo'], 400);
            }
        }

        // Registrar o actualizar voto
        GameVote::updateOrCreate(
            [
                'game_id' => $gameId,
                'voter_id' => $botId,
                'phase' => $game->current_phase,
                'round' => $game->current_round
            ],
            [
                'target_id' => $targetId
            ]
        );

        // Verificar si todos votaron
        $this->checkVotingComplete($game);

        return response()->json([
            'success' => true,
            'message' => 'Voto registrado'
        ]);
    }
}
