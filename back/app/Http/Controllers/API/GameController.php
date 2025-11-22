<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Game;
use App\Models\User;

class GameController extends Controller
{
    public function getGames() {
        $games = Game::all();

        return response()->json($games,200);
    }


    //------------------------------------------------------------------------
    public function findGame($id) {
        $game = Game::find($id);
        return response()->json($id,200);
    }

    //------------------------------------------------------------------------
    public function insertGame(Request $req) {

        $game = new Game;
        $user = $req->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no autenticado'
            ], 401);
        }

        $game->name = $req->get('name');
        $game->join_code = null;
        if ($req->get('publicGame') == false) { $game->join_code = $req->get('joinCode'); }

        $game->created_by_user_id = $user->id;
        $game->status='lobby';
        $game->min_players=15;
        $game->max_players=$req->get('maxPlayers');

        try {
            $game->save();

            $gameData = [
                'id' => $game->id,
                'name' => $game->name,
                'join_code' => $game->join_code,
                'created_by_user_id' => $game->created_by_user_id,
                'status' => $game->status,
                'min_players' => $game->min_players,
                'max_players' => $game->max_players
            ];

            return response()->json(["success"=>true,"data"=>$gameData, "message" => "Game successfully inserted!"]);
        } catch (\Exception $e) {
            $error = 'ERROR: '.strval($e);
            return response()->json(['mens' => $error],404);
        }
    }
}
