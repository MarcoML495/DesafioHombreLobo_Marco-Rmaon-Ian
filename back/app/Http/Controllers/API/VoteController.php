<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Game;
use App\Models\GamePlayer;
use App\Models\GameVote;
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

        $voter = GamePlayer::where('game_id', $gameId)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->where('status', 'playing')
            ->first();

        if (!$voter) {
            return response()->json(['success' => false, 'message' => 'No puedes votar'], 403);
        }

        $target = GamePlayer::where('game_id', $gameId)
            ->where('user_id', $request->target_id)
            ->where('is_active', true)
            ->where('status', 'playing')
            ->first();

        if (!$target) {
            return response()->json(['success' => false, 'message' => 'Objetivo no válido'], 400);
        }

        if ($game->current_phase === 'night') {
            if ($voter->role !== 'lobo') {
                return response()->json(['success' => false, 'message' => 'Solo los lobos votan de noche'], 403);
            }

            if ($target->role === 'lobo') {
                return response()->json(['success' => false, 'message' => 'No puedes votar a otro lobo'], 400);
            }
        }

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

        if ($game->current_phase === 'night' && $player->role !== 'lobo') {
            $votes = collect();
        }

        $eligibleVoters = GamePlayer::where('game_id', $game->id)
            ->where('is_active', true)
            ->where('status', 'playing')
            ->when($game->current_phase === 'night', fn($q) => $q->where('role', 'lobo'))
            ->get();

        $votedCount = $votes->pluck('voter_id')->unique()->count();

        return response()->json([
            'success' => true,
            'data' => [
                'votes' => $votes,
                'voted_count' => $votedCount,
                'total_voters' => $eligibleVoters->count(),
                'all_voted' => $votedCount === $eligibleVoters->count(),
                'my_vote' => $votes->where('voter_id', $user->id)->first()
            ]
        ]);
    }

    /**
     * Variacion de la funcion de votar hecha solo para bots
     */
    public function voteBot($gameId, $botId, $targetId)
    {
        $game = Game::find($gameId);

        if (!$game || $game->status !== 'in_progress') {
            return false;
        }

        $voter = GamePlayer::where('game_id', $gameId)
            ->where('user_id', $botId)
            ->where('is_active', true)
            ->where('status', 'playing')
            ->first();

        if (!$voter) {
            return false;
        }

        $target = GamePlayer::where('game_id', $gameId)
            ->where('user_id', $targetId)
            ->where('is_active', true)
            ->where('status', 'playing')
            ->first();

        if (!$target) {
            return false;
        }

        if ($game->current_phase === 'night') {
            if ($voter->role !== 'lobo' || $target->role === 'lobo') {
                return false;
            }
        }

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

        return true;
    }
}
