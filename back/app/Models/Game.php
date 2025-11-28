<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    /**
     * Nombre de la tabla.
     */
    protected $table = 'games';

    /**
     * Clave primaria.
     */
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'int';

    /**
     * Campos que se pueden asignar masivamente.
     */
    protected $fillable = [
        'name',
        'join_code',
        'created_by_user_id',
        'status',
        'min_players',
        'max_players',
        'started_at',
        'ended_at'
    ];

    /**
     * Casts automáticos de tipos.
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    /**
     * RELACIONES
     */

    /**
     * Relación N:1 con el creador (User)
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * Relación 1:N con GamePlayer (jugadores en esta partida)
     */
    public function players()
    {
        return $this->hasMany(GamePlayer::class, 'game_id');
    }

    /**
     * Relación N:M con User a través de GamePlayer
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'game_players', 'game_id', 'user_id')
                    ->withPivot('status', 'role', 'joined_at', 'left_at');
    }

    /**
     * MÉTODOS AUXILIARES
     */

    /**
     * Obtener el conteo actual de jugadores activos
     */
    public function currentPlayersCount(): int
    {
        return $this->players()
                    ->whereIn('status', ['waiting', 'ready', 'playing'])
                    ->count();
    }

    /**
     * Verificar si la partida está llena
     */
    public function isFull(): bool
    {
        return $this->currentPlayersCount() >= $this->max_players;
    }

    /**
     * Verificar si es una partida pública
     */
    public function isPublic(): bool
    {
        return is_null($this->join_code) || $this->join_code === '';
    }

    /**
     * Verificar si está en estado de lobby (aceptando jugadores)
     */
    public function isLobby(): bool
    {
        return $this->status === 'lobby';
    }

    /**
     * Verificar si está en progreso
     */
    public function isInProgress(): bool
    {
        return $this->status === 'in_progress';
    }

    /**
     * Verificar si terminó
     */
    public function isFinished(): bool
    {
        return $this->status === 'finished';
    }

    /**
     * Verificar si un usuario ya está en esta partida
     */
    public function hasPlayer(int $userId): bool
    {
        return $this->players()
                    ->where('user_id', $userId)
                    ->whereIn('status', ['waiting', 'ready', 'playing'])
                    ->exists();
    }

    /**
     * Verificar si la partida puede aceptar más jugadores
     */
    public function canJoin(): bool
    {
        return $this->isLobby() && !$this->isFull();
    }
}
