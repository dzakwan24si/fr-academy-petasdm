<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    /**
     * Handle an incoming request and attach essential security headers.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Remove PHP version disclosure from header
        if (function_exists('header_remove')) {
            header_remove('X-Powered-By');
        }

        $response = $next($request);

        // Remove from response object headers if set by framework / web server
        $response->headers->remove('X-Powered-By');

        // 2. Content Security Policy (CSP)
        // Accommodates Vite assets, Inertia.js, React, Tailwind, and Cloudflare Turnstile
        $scriptDirectives = [
            "'self'",
            'https://challenges.cloudflare.com',
        ];

        // Only allow unsafe directives in local dev mode when Vite HMR is actively running
        if (app()->environment('local') && config('app.debug')) {
            $scriptDirectives[] = "'unsafe-inline'";
            $scriptDirectives[] = "'unsafe-eval'";
        }

        $cspDirectives = [
            "default-src 'self'",
            'script-src '.implode(' ', $scriptDirectives),
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' data: https://fonts.gstatic.com",
            "img-src 'self' data: blob: https://*.first-resources.com",
            "connect-src 'self' https://challenges.cloudflare.com",
            "frame-src 'self' https://challenges.cloudflare.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self' https://challenges.cloudflare.com",
        ];

        $response->headers->set('Content-Security-Policy', implode('; ', $cspDirectives));

        // 3. Essential Security Headers (HSTS, nosniff, SAMEORIGIN, Referrer-Policy)
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // HSTS (HTTP Strict Transport Security)
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        return $response;
    }
}
