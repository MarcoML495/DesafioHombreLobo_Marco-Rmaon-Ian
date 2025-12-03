<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LobbyMessage implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $gameId;
    public $user;
    public $message;
    public $timestamp;

    public function __construct($gameId, User $user, $message)
    {
        $this->gameId = $gameId;
        $this->user = [
            'id' => $user->id,
            'name' => $user->name,
        ];
        $this->message = $message;
        $this->timestamp = now()->toTimeString();
    }

    public function broadcastOn(): array
    {
        
        return [
            new PresenceChannel('lobby.' . $this->gameId),
        ];
    }
    
    public function broadcastAs()
    {
        return 'message.sent';
    }
}