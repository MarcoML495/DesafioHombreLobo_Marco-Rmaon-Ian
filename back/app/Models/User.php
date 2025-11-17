<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * Nombre de la tabla.
     */
    protected $table = 'users';

    /**
     * Clave primaria.
     */
    protected $primaryKey = 'id';
    public $incrementing = false; // UUID
    protected $keyType = 'string';

    /**
     * Campos que se pueden asignar masivamente.
     */
    protected $fillable = [
        'id',
        'name',
        'email',
        'password',
        'avatar_image_id',
        'created_at',
        'last_login_at',
    ];

    /**
     * Campos ocultos al serializar.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Casts automáticos de tipos.
     */
    protected $casts = [
        'created_at' => 'datetime',
        'last_login_at' => 'datetime',
    ];

    /**
     * RELACIONES
     */

    // 1:1 con estadísticas del usuario
    public function stats()
    {
        return $this->hasOne(UserStats::class, 'user_id');
    }

    // 1:N con las partidas creadas
    public function createdGames()
    {
        return $this->hasMany(Game::class, 'created_by_user_id');
    }

    // 1:N con las participaciones en partidas
    public function gamePlayers()
    {
        return $this->hasMany(GamePlayer::class, 'user_id');
    }

    // (Opcional) Imagen de avatar
    public function avatar()
    {
        return $this->belongsTo(Image::class, 'avatar_image_id');
    }


    // Nombre visible (p. ej. para logs o chat)
    public function displayName(): string
    {
        return $this->username ?: 'Jugador Anónimo';
    }
}
