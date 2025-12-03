<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LobbyUpdated implements ShouldBroadcast  
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $gameId;
    public $type; 

    public function __construct($gameId, $type = 'update')
    {
        $this->gameId = $gameId;
        $this->type = $type;
    }

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('lobby.' . $this->gameId),
        ];
    }
    
    public function broadcastAs()
    {
        return 'lobby.updated';
    }
}