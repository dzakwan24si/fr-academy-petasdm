<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Location;
use Illuminate\Support\Facades\DB;

class ResetCoordinatesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sdm:reset-coordinates {--force : Force reset without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset all coordinates and coordinate sources to null';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!$this->option('force')) {
            if (!$this->confirm('Apakah Anda yakin ingin mereset semua koordinat di tabel locations?')) {
                $this->info('Dibatalkan.');
                return;
            }
        }

        $count = Location::whereNotNull('latitude')->orWhereNotNull('longitude')->count();
        
        Location::query()->update([
            'latitude' => null,
            'longitude' => null,
            'coordinate_source' => 'manual'
        ]);

        $this->info("Berhasil mereset koordinat untuk {$count} lokasi.");
    }
}
