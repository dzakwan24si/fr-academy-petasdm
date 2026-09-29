<?php

namespace App\Console\Commands;

use App\Services\Import\EmployeeImporter;
use App\Services\Import\TrainingImporter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportSdm extends Command
{
    protected $signature = 'sdm:import
        {employees : path CSV Data Employee (delimiter ;)}
        {training : path CSV Training Record (delimiter ;)}
        {--fresh : kosongkan tabel employees dan training_records dulu}';

    protected $description = 'Import dan bersihkan data employee serta training record';

    public function handle(EmployeeImporter $empImporter, TrainingImporter $trainImporter): int
    {
        if ($this->option('fresh')) {
            DB::table('training_records')->delete();
            DB::table('employees')->delete();
        }

        $this->info('Import employees...');
        $empBatch = $empImporter->import($this->argument('employees'));
        $this->info("Employee import completed: {$empBatch->rows_imported} imported, {$empBatch->rows_skipped} skipped out of {$empBatch->rows_total} rows.");
        if ($empBatch->warnings) {
            $this->warn("Warnings:");
            foreach ($empBatch->warnings as $k => $w) {
                $this->line("- {$w['message']}: {$w['count']} times");
            }
        }

        $this->info('Import training records...');
        $trainBatch = $trainImporter->import($this->argument('training'));
        $this->info("Training import completed: {$trainBatch->rows_imported} imported, {$trainBatch->rows_skipped} skipped out of {$trainBatch->rows_total} rows.");
        if ($trainBatch->warnings) {
            $this->warn("Warnings:");
            foreach ($trainBatch->warnings as $k => $w) {
                $this->line("- {$w['message']}: {$w['count']} times");
            }
        }

        $this->report();

        return self::SUCCESS;
    }

    private function report(): void
    {
        $unmapped = DB::table('company_aliases')->whereNull('company_id')->count();
        $total = DB::table('company_aliases')->count();

        $this->newLine();
        $this->warn("Alias Nama PT belum terpetakan: $unmapped dari $total.");
        $this->line('Lihat: SELECT alias FROM company_aliases WHERE company_id IS NULL;');
    }
}
