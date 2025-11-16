<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;


/* 
Route::get('/nologin', function () {
    return response()->json(["success"=>false, "message" => "Unauthorised"],203);
}); */


Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);