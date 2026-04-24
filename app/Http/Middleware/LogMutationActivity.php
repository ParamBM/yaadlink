<?php

namespace App\Http\Middleware;

use App\Services\UserActivityLogger;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Records one audit row per mutating API request (POST/PUT/PATCH/DELETE).
 * Skips /api/users* — UserController already writes detailed rows for those.
 */
class LogMutationActivity
{
    private const SKIP_PREFIXES = [
        'api/users',
        'api/auth',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (!in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return $response;
        }

        $path = ltrim($request->path(), '/');

        foreach (self::SKIP_PREFIXES as $prefix) {
            if ($path === $prefix || str_starts_with($path, $prefix.'/')) {
                return $response;
            }
        }

        $module = $this->inferModule($path);
        $activity = substr($request->method().' '.$path, 0, 50);
        $status = $response->getStatusCode();
        $note = 'HTTP '.$status;

        UserActivityLogger::log(
            $request,
            $activity,
            $module,
            'http_request',
            null,
            null,
            null,
            ['path' => '/'.$path, 'status' => $status],
            $note
        );

        return $response;
    }

    private function inferModule(string $path): string
    {
        if (!str_starts_with($path, 'api/')) {
            return 'api';
        }

        $rest = substr($path, 4);
        $segment = explode('/', $rest, 2)[0] ?? 'api';

        return substr($segment !== '' ? $segment : 'api', 0, 100);
    }
}
