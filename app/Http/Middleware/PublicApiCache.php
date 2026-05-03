<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PublicApiCache
{
    public function handle(
        Request $request,
        Closure $next,
        int $browserTtl = 60,
        int $cdnTtl = 300,
        int $staleTtl = 86400
    ): Response {
        $response = $next($request);

        if (!in_array($request->method(), ['GET', 'HEAD'], true) || !$response->isSuccessful()) {
            return $response;
        }

        if ($request->headers->has('Authorization')) {
            $response->headers->set('Cache-Control', 'private, max-age=0, must-revalidate');

            return $response;
        }

        $sharedPolicy = sprintf('public, s-maxage=%d, stale-while-revalidate=%d', $cdnTtl, $staleTtl);

        $response->headers->set(
            'Cache-Control',
            sprintf('public, max-age=%d, s-maxage=%d, stale-while-revalidate=%d', $browserTtl, $cdnTtl, $staleTtl)
        );
        $response->headers->set('CDN-Cache-Control', $sharedPolicy);
        $response->headers->set('Vercel-CDN-Cache-Control', $sharedPolicy);
        $response->headers->set('Vary', 'Accept, Accept-Encoding');

        return $response;
    }
}
