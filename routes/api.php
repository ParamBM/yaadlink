<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\UserController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\Auth\OccasionTypeController;
use App\Http\Controllers\Auth\UserActivityLogsController;

use App\Http\Middleware\CheckRole;

// ── Auth ──────────────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/login',          [UserController::class, 'login']);
    Route::post('/logout',         [UserController::class, 'logout'])->middleware(CheckRole::class);
    Route::get('/check',           [UserController::class, 'authenticateToken'])->middleware(CheckRole::class);

});

// ── Users (admin / director) ──────────────────────────────────────────────────
Route::middleware(CheckRole::class . ':admin,director')->group(function () {
    Route::get('/users',          [UserController::class, 'index']);
    Route::post('/users',         [UserController::class, 'store']);
    Route::get('/users/{id}',     [UserController::class, 'show']);
    Route::put('/users/{id}',     [UserController::class, 'update']);
    Route::delete('/users/{id}',  [UserController::class, 'destroy']);
});

// ── Activity Logs (admin / director) ─────────────────────────────────────────
Route::middleware(CheckRole::class . ':admin,director')->group(function () {
    Route::get('/activity-logs',  [UserActivityLogsController::class, 'index']);
});

// ── Occasion Types ────────────────────────────────────────────────────────────
Route::prefix('occasion-types')->group(function () {
    Route::get('/public', [OccasionTypeController::class, 'publicIndex']);

    Route::middleware(CheckRole::class . ':admin,director')->group(function () {
        Route::get('/',       [OccasionTypeController::class, 'index']);
        Route::post('/',      [OccasionTypeController::class, 'store']);
        Route::get('/{id}',   [OccasionTypeController::class, 'show']);
        Route::put('/{id}',   [OccasionTypeController::class, 'update']);
        Route::delete('/{id}',[OccasionTypeController::class, 'destroy']);
    });
});