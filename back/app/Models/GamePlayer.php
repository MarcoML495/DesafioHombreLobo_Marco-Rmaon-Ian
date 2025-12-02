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
        'is_active',
        'role',
        'joined_at',
        'left_at',
    ];

    /**
     * Casts de atributos.
     */
    protected $casts = [
        'is_active' => 'boolean',
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
        return $this->is_active && in_array($this->status, ['waiting', 'ready', 'playing']);
    }

    /**
     * Verificar si el jugador está jugando
     */
    public function isPlaying(): bool
    {
        return $this->is_active && $this->status === 'playing';
    }

    /**
     * Verificar si el jugador está muerto
     */
    public function isDead(): bool
    {
        return $this->status === 'dead';
    }

    /**
     * Desactivar esta entrada (el jugador abandona)
     */
    public function deactivate(): void
    {
        $this->update([
            'is_active' => false,
            'left_at' => now(),
        ]);
    }

    /**
     * SCOPES
     */

    /**
     * Scope para jugadores activos
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope para jugadores en espera
     */
    public function scopeWaiting($query)
    {
        return $query->where('status', 'waiting')->where('is_active', true);
    }
}
