<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\GamePlayer;

Broadcast::channel('lobby.{gameId}', function ($user, $gameId) {
    $isPlayer = GamePlayer::where('game_id', $gameId)
        ->where('user_id', $user->id)
        ->where('is_active', true)
        ->exists();

    if ($isPlayer) {
        return ['id' => $user->id, 'name' => $user->name];
    }
    
    return false;
});