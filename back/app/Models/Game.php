<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    //Nombre de la tabla.
    protected $table = 'games';

    //Clave primaria.
    protected $primaryKey = 'id';
    public $incrementing = true; 
    protected $keyType = 'string';

    //Campos que se pueden asignar masivamente.
    protected $fillable = [
        'id',
        'join_code',
        'created_by_user_id',
        'status',
        'min_players',
        'max_players',
        'created_at',
        'started_at',
        'ended_at'
    ];

    //Casts automáticos de tipos.
    protected $casts = [
        'created_at' => 'datetime',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    /**
     * RELACIONES
     */

    // N:1 con usuarios
    function creator(){
        return $this->belongsTo(User::class,'id','created_by_user_id');
    }
}
