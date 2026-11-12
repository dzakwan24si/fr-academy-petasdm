<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::useManifestFilename('.vite/manifest.json');

        if (
            str_starts_with((string) config('app.url'), 'https://')
            || app()->isProduction()
            || (app()->bound('request') && request()->isSecure())
            || (app()->bound('request') && request()->header('x-forwarded-proto') === 'https')
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
            || (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on')
        ) {
            URL::forceScheme('https');
        }
    }
}
