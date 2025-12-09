<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GamePhaseChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $gameId;
    public $phaseData;

    public function __construct($gameId, $phaseData)
    {
        $this->gameId = $gameId;
        $this->phaseData = $phaseData;
    }

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('lobby.' . $this->gameId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'game.phase.changed';
    }

    public function broadcastWith(): array
    {
        return $this->phaseData;
    }
}
