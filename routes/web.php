<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Auth\SocialAuthController;

// Google OAuth
Route::get('/auth/google/redirect', [SocialAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [SocialAuthController::class, 'callback'])->name('auth.google.callback');

// Catch-all: serve the React SPA for every non-API request.
// Routing is handled entirely by React Router on the frontend.
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
