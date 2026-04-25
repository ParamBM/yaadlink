<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\UserController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\Auth\OccasionTypeController;
use App\Http\Controllers\Auth\StoryController;
use App\Http\Controllers\Auth\ThemeController;
use App\Http\Controllers\Auth\UserActivityLogsController;
use App\Http\Controllers\Api\UploadController;

use App\Http\Middleware\CheckRole;

// ── Auth ──────────────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register',       [UserController::class, 'register']);
    Route::post('/login',          [UserController::class, 'login']);
    Route::post('/logout',         [UserController::class, 'logout'])->middleware(CheckRole::class);
    Route::get('/check',           [UserController::class, 'authenticateToken'])->middleware(CheckRole::class);

});

// ── Users (admin) ──────────────────────────────────────────────────
Route::middleware(CheckRole::class . ':admin')->group(function () {
    Route::get('/users',          [UserController::class, 'index']);
    Route::post('/users',         [UserController::class, 'store']);
    Route::get('/users/{id}',     [UserController::class, 'show']);
    Route::put('/users/{id}',     [UserController::class, 'update']);
    Route::delete('/users/{id}',  [UserController::class, 'destroy']);
    Route::delete('/users/{id}/force', [UserController::class, 'forceDestroy']);
});

// ── Activity Logs (admin) ─────────────────────────────────────────
Route::middleware(CheckRole::class . ':admin')->group(function () {
    Route::get('/activity-logs',  [UserActivityLogsController::class, 'index']);
});

// ── Occasion Types ────────────────────────────────────────────────────────────
Route::prefix('occasion-types')->group(function () {
    Route::get('/public', [OccasionTypeController::class, 'publicIndex']);

    Route::middleware(CheckRole::class . ':admin')->group(function () {
        Route::get('/',       [OccasionTypeController::class, 'index']);
        Route::post('/',      [OccasionTypeController::class, 'store']);
        Route::get('/{id}',   [OccasionTypeController::class, 'show']);
        Route::put('/{id}',   [OccasionTypeController::class, 'update']);
        Route::delete('/{id}',[OccasionTypeController::class, 'destroy']);
    });
});

// Themes
Route::prefix('themes')->group(function () {
    Route::get('/public', [ThemeController::class, 'publicIndex']);

    Route::middleware(CheckRole::class . ':admin')->group(function () {
        Route::get('/',       [ThemeController::class, 'index']);
        Route::post('/',      [ThemeController::class, 'store']);
        Route::get('/{id}',   [ThemeController::class, 'show']);
        Route::put('/{id}',   [ThemeController::class, 'update']);
        Route::delete('/{id}',[ThemeController::class, 'destroy']);
    });
});

// Stories
Route::prefix('stories')->group(function () {
    Route::get('/public', [StoryController::class, 'publicIndex']);
    Route::get('/public/{slug}', [StoryController::class, 'publicShow']);

    // Public AI enhancement — API key is server-side only, no auth needed
    Route::post('/enhance', [StoryController::class, 'enhance']);

    Route::middleware(CheckRole::class)->group(function () {
        Route::get('/',       [StoryController::class, 'index']);
        Route::post('/',      [StoryController::class, 'store']);
        Route::get('/{id}',   [StoryController::class, 'show']);
        Route::put('/{id}',   [StoryController::class, 'update']);
        Route::delete('/{id}',[StoryController::class, 'destroy']);
    });
});

// Image Upload
Route::post('/upload/public', [UploadController::class, 'store']);

Route::middleware(CheckRole::class)->group(function () {
    Route::post('/upload', [UploadController::class, 'store']);
});
