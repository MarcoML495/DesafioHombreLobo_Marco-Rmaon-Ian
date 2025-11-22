<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Game;
use App\Models\User;

class GameController extends Controller
{
    public function getGames() {
        $games = Game::all();

        return response()->json($games,200);
    }


    //------------------------------------------------------------------------
    public function findGame($id) {
        $game = Game::find($id);
        return response()->json($id,200);
    }

    //------------------------------------------------------------------------
    public function insertGame(Request $req) {

        $game = new Game;
        $user = $req->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no autenticado'
            ], 401);
        }

        $game->name = $req->get('name');
        $game->join_code = null;
        if ($req->get('publicGame') == false) { $game->join_code = $req->get('joinCode'); }

        $game->created_by_user_id = $user->id;
        $game->status='lobby';
        $game->min_players=15;
        $game->max_players=$req->get('maxPlayers');

        try {
            $game->save();

            $gameData = [
                'id' => $game->id,
                'name' => $game->name,
                'join_code' => $game->join_code,
                'created_by_user_id' => $game->created_by_user_id,
                'status' => $game->status,
                'min_players' => $game->min_players,
                'max_players' => $game->max_players
            ];

            return response()->json(["success"=>true,"data"=>$gameData, "message" => "Game successfully inserted!"]);
        } catch (\Exception $e) {
            $error = 'ERROR: '.strval($e);
            return response()->json(['mens' => $error],404);
        }

    }

    //------------------------------------------------------------------------
    public function insertarPropiedad(Request $req) {


        $pe = new Propiedad;

        try {
            $pe = $pe->create($req->all());
            return response()->json($pe,200);
        } catch (\Exception $e) {
            $mensaje = 'Clave duplicada';
            return response()->json($pe,404);
        }

    }

    //------------------------------------------------------------------------
    public function vermayores() {
        $pers = Persona::where('edad', '>', 18)
                ->orderBy('nombre', 'asc')
                ->get();

        return response()->json($pers,200);
    }


    //------------------------------------------------------------------------
    public function modificarPersona(Request $req, $dni) {
        $persona = Persona::find($dni);

        if ($persona) {
            $persona->update([
                'nombre' => $req->input('nombre'),
                'tfno'   => $req->input('tfno'),
                'edad'   => $req->input('edad')
            ]);

            return response()->json(['mensaje' => 'Persona modificada correctamente.'], 200);
        } else {
            return response()->json(['mensaje' => 'Persona no encontrada.'], 404);
        }
    }

    //------------------------------------------------------------------------
    public function borrarPersona($dni) {
        $persona = Persona::find($dni);

        if ($persona) {
            $persona->delete();
            return response()->json(['mensaje' => 'Persona eliminada correctamente.'], 200);
        } else {
            return response()->json(['mensaje' => 'Persona no encontrada.'], 404);
        }
    }

    //------------------------------------------------------------------------
    public function comentariosPersona($dni) {
        $pers = Persona::with('comentariosDe')->where('dni','=',$dni)->get();

        return response()->json($pers,200);
    }

    //------------------------------------------------------------------------
    public function mostrarComentarios() {
        $pers = Comentario::with('perteneceA')->get();

        return response()->json($pers,200);
    }

    //------------------------------------------------------------------------
    public function cochesDe($dni){
        try {
            // $info = Persona::with('coches')->where('dni',$dni)->get();
            // return response()->json($info,200);

            //Si solo queremos las matrículas de los coches de la persona
            $persona = Persona::findOrFail($dni); //Usamos findOrFail para lanzar excepción si no existe porque find devolvería null.
            $matriculas = $persona->coches()->get()->pluck('matricula');
            //$matriculas es Collection de strings
            return response()->json($matriculas,200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener las propiedades',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    //------------------------------------------------------------------------
    public function propietariosDe($matricula){
        $info = Coche::with('propietarios')->where('matricula',$matricula)->get();
        //$info = Coche::find($matricula)->propietarios()->get();
        return response()->json($info,200);
    }

    //------------------------------------------------------------------------
    public function todaspropiedades()
    {
        try {
            // Opción A)
            // $info = Propiedad::with(['infoCoche','infoPersona'])->get();

            // Opción B) - usando relaciones correctamente definidas
            $info = Propiedad::with(['coche','persona'])->get();

            return response()->json($info, 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener las propiedades',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    //------------------------------------------------------------------------
    // Attach: asociar uno o varios coches a la persona
    public function attachCoche(Request $request, $dni)
    {
        try {
            $persona = Persona::findOrFail($dni);

            $coches = $request->input('coches');

            if (empty($coches) || !is_array($coches)) {
                return response()->json([
                    'message' => 'Debe enviar un array de matrículas'
                ], 400);
            }

            // Asociar los coches a la persona
            $persona->coches()->attach($coches);

            return response()->json([
                'message' => 'Coches asociados correctamente',
                'coches' => $persona->coches()->get()->pluck('matricula')
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Persona no encontrada'
            ], 404);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al asociar coches',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    //------------------------------------------------------------------------
    // Detach: eliminar la relación con uno o varios coches
    public function detachCoche(Request $request, $dni)
    {
        try {
            $persona = Persona::findOrFail($dni);

            $coches = $request->input('coches');

            if (empty($coches) || !is_array($coches)) {
                return response()->json([
                    'message' => 'Debe enviar un array de matrículas'
                ], 400);
            }

            // Desasociar los coches
            $persona->coches()->detach($coches);

            return response()->json([
                'message' => 'Coches desasociados correctamente',
                'coches' => $persona->coches()->get()->pluck('matricula')
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Persona no encontrada'
            ], 404);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al desasociar coches',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
