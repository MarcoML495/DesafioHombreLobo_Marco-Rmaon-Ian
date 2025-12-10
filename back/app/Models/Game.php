<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    protected $fillable = [
        'name',
        'join_code',
        'created_by_user_id',
        'status',
        'min_players',
        'max_players',
    ];

    protected $casts = [
        'phase_started_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * RELACIONES
     */

    /**
     * Relación con el creador del juego
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * Relación con los jugadores
     */
    public function players()
    {
        return $this->hasMany(GamePlayer::class, 'game_id');
    }

    /**
     * Relación con jugadores ACTIVOS
     */
    public function activePlayers()
    {
        return $this->hasMany(GamePlayer::class, 'game_id')
            ->where('is_active', true)
            ->whereIn('status', ['waiting', 'ready', 'playing']);
    }

    /**
     * MÉTODOS AUXILIARES
     */

    /**
     * Verificar si el juego es público
     */
    public function isPublic(): bool
    {
        return $this->join_code === null || $this->join_code === '';
    }

    /**
     * Verificar si el juego está en lobby
     */
    public function isLobby(): bool
    {
        return $this->status === 'lobby';
    }

    /**
     * Verificar si el juego está en progreso
     */
    public function isInProgress(): bool
    {
        return $this->status === 'in_progress';
    }

    /**
     * Verificar si el juego terminó
     */
    public function isFinished(): bool
    {
        return $this->status === 'finished';
    }

    /**
     * Obtener cantidad de jugadores ACTIVOS
     */
    public function currentPlayersCount(): int
    {
        return $this->players()
            ->where('is_active', true)
            ->whereIn('status', ['waiting', 'ready', 'playing'])
            ->count();
    }

    /**
     * Verificar si el juego está lleno
     */
    public function isFull(): bool
    {
        return $this->currentPlayersCount() >= $this->max_players;
    }

    /**
     * Verificar si se puede unir
     */
    public function canJoin(): bool
    {
        return $this->isLobby() && !$this->isFull();
    }

    /**
     * Verificar si tiene el número mínimo de jugadores para iniciar
     */
    public function hasMinimumPlayers(): bool
    {
        return $this->currentPlayersCount() >= $this->min_players;
    }

    /**
     * Verificar si un usuario está en el juego (ACTIVO)
     */
    public function hasPlayer(int $userId): bool
    {
        return $this->players()
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->whereIn('status', ['waiting', 'ready', 'playing'])
            ->exists();
    }

    /**
     * Verificar si un usuario es el creador
     */
    public function isCreator(int $userId): bool
    {
        return $this->created_by_user_id === $userId;
    }
}
