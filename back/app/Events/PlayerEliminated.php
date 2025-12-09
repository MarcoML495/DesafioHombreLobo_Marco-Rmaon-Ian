<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PlayerEliminated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $gameId;
    public $data;

    public function __construct($gameId, $data)
    {
        $this->gameId = $gameId;
        $this->data = $data;
    }

    public function broadcastOn(): array
    {
        return [new PresenceChannel('lobby.' . $this->gameId)];
    }

    public function broadcastAs(): string
    {
        return 'player.eliminated';
    }

    public function broadcastWith(): array
    {
        return $this->data;
    }
}
