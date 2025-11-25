<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Images extends Model
{
    /**
     * Nombre de la tabla.
     */
    protected $table = 'images';

    const UPDATED_AT = null;
    /**
     * Campos asignables.
     */
    protected $fillable = [
        'url',
        'created_at',
    ];

    /**
     * Casteos de atributos.
     */
    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Relación con usuarios que usan esta imagen como avatar.
     */
    public function usersWithThisAvatar()
    {
        return $this->hasMany(User::class, 'avatar_image_id');
    }
}
