<?php

namespace App\Console\Commands;

use App\Services\Import\TrainingImporter;
use Illuminate\Console\Command;
use Throwable;

class SyncPortalCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sdm:sync-portal {--dry-run : Simulasi penarikan data portal tanpa mengubah database} {--scheduled : Penjalanan otomatis dari scheduler}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Tarik data training dari Portal FR Academy';

    /**
     * Execute the console command.
     */
    public function handle(TrainingImporter $importer): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $scheduled = (bool) $this->option('scheduled');

        $modeText = $scheduled ? ' (terjadwal)' : ($dryRun ? ' (dry-run)' : '');
        $this->info("Menjalankan sync portal{$modeText}...");

        try {
            $batch = $importer->importFromPortal(null, $dryRun, $scheduled);

            if ($batch->status === 'failed') {
                $err = is_array($batch->warnings) ? ($batch->warnings['error'] ?? 'Gagal') : 'Gagal';
                $this->error("Gagal! {$err}");

                return Command::FAILURE;
            }

            $this->info("Berhasil! Total: {$batch->rows_total}, Diimpor: {$batch->rows_imported}, Dilewati: {$batch->rows_skipped}");

            return Command::SUCCESS;
        } catch (Throwable $e) {
            $this->error('Gagal: '.$e->getMessage());

            return Command::FAILURE;
        }
    }
}
