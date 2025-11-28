<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GamePlayer extends Model
{
    /**
     * Nombre de la tabla.
     */
    protected $table = 'game_players';

    /**
     * Desactivar timestamps automáticos (usamos joined_at personalizado)
     */
    public $timestamps = false;

    /**
     * Campos asignables.
     */
    protected $fillable = [
        'game_id',
        'user_id',
        'status',
        'role',
        'joined_at',
        'left_at',
    ];

    /**
     * Casts de atributos.
     */
    protected $casts = [
        'joined_at' => 'datetime',
        'left_at' => 'datetime',
    ];

    /**
     * RELACIONES
     */

    /**
     * Relación N:1 con Game
     */
    public function game()
    {
        return $this->belongsTo(Game::class, 'game_id');
    }

    /**
     * Relación N:1 con User
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * MÉTODOS AUXILIARES
     */

    /**
     * Verificar si el jugador está activo en la partida
     */
    public function isActive(): bool
    {
        return in_array($this->status, ['waiting', 'ready', 'playing']);
    }

    /**
     * Verificar si el jugador está jugando
     */
    public function isPlaying(): bool
    {
        return $this->status === 'playing';
    }

    /**
     * Verificar si el jugador está muerto
     */
    public function isDead(): bool
    {
        return $this->status === 'dead';
    }
}
