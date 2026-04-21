<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\UserController;

use App\Http\Middleware\CheckRole;

Route::prefix('auth')->group(function () {
    Route::post('/login', [UserController::class, 'login']);
    Route::post('/logout', [UserController::class, 'logout'])->middleware(CheckRole::class);
    Route::get('/check', [UserController::class, 'authenticateToken'])->middleware(CheckRole::class);
});