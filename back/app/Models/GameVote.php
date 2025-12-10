<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GameVote extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_id',
        'voter_id',
        'target_id',
        'phase',
        'round'
    ];

    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function voter()
    {
        return $this->belongsTo(User::class, 'voter_id');
    }

    public function target()
    {
        return $this->belongsTo(User::class, 'target_id');
    }
}
