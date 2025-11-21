<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class User extends Authenticatable{
    use HasFactory, Notifiable, HasApiTokens, HasUuids;

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
        'real_name',
        'email',
        'password',
        'bio',
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

    // Imagen de avatar
    public function avatar()
    {
        return $this->belongsTo(Image::class, 'avatar_image_id');
    }

    /**
     * MÉTODOS AUXILIARES
     */

    /**
     * Obtiene el nombre para mostrar del usuario.
     * Prioriza real_name, luego name, o un valor por defecto.
     *
     * @return string
     */
    public function displayName(): string
    {
        return $this->real_name ?: ($this->name ?: 'Jugador Anónimo');
    }

    /**
     * Obtiene el nombre completo o el username si no existe.
     *
     * @return string
     */
    public function fullName(): string
    {
        return $this->real_name ?: $this->name;
    }

    /**
     * Verifica si el usuario tiene un nombre completo definido.
     *
     * @return bool
     */
    public function hasRealName(): bool
    {
        return !empty($this->real_name);
    }

    /**
     * Verifica si el usuario tiene biografía.
     *
     * @return bool
     */
    public function hasBio(): bool
    {
        return !empty($this->bio);
    }

    /**
     * Obtiene la biografía truncada a N caracteres.
     *
     * @param int $length
     * @return string
     */
    public function shortBio(int $length = 100): string
    {
        if (!$this->hasBio()) {
            return '';
        }

        return strlen($this->bio) > $length
            ? substr($this->bio, 0, $length) . '...'
            : $this->bio;
    }

}
