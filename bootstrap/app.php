<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

// On Vercel, the filesystem is read-only except /tmp
if (isset($_ENV['VERCEL']) || isset($_SERVER['VERCEL'])) {
    $tmpStorage = '/tmp/storage';
    foreach (['app', 'app/public', 'framework', 'framework/cache', 'framework/sessions', 'framework/views', 'logs'] as $dir) {
        @mkdir("$tmpStorage/$dir", 0775, true);
    }
    $_ENV['APP_STORAGE'] = $tmpStorage;
}

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
