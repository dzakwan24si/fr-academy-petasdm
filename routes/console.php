<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('sdm:sync-portal --scheduled')
    ->dailyAt(config('services.portal.sync_time', '02:00'))
    ->timezone(config('app.timezone'))
    ->withoutOverlapping(30)
    ->runInBackground()
    ->when(fn () => (bool) config('services.portal.sync_enabled'))
    ->onFailure(function () {
        Log::error('Sync portal terjadwal gagal. Cek halaman Import.');
    });
