<?php

use Illuminate\Support\Facades\Route;

// Catch-all: serve the React SPA for every non-API request.
// Routing is handled entirely by React Router on the frontend.
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
