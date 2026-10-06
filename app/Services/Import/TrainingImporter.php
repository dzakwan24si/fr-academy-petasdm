<?php

namespace App\Services\Import;

use App\Imports\GenericImport;
use App\Models\ImportBatch;
use App\Services\Portal\PortalTrainingClient;
use App\Support\Clean;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use RuntimeException;
use Throwable;

class TrainingImporter
{
    private array $companyByKey = [];

    private array $aliasMap = [];

    private array $employeeIds = [];

    public function import(UploadedFile $file, ?int $userId = null): ImportBatch
    {
        $batch = ImportBatch::create([
            'user_id' => $userId,
            'type' => 'training',
            'filename' => $file->getClientOriginalName(),
            'status' => 'running',
            'started_at' => now(),
        ]);

        $report = new ImportReport;

        try {
            DB::transaction(function () use ($file, $report) {
                // Delete existing records
                DB::table('training_records')->delete();

                $this->loadLookups();

                $this->processFile($file, $report);
            });

            $batch->update([
                'rows_total' => $report->totalRows,
                'rows_imported' => $report->importedRows,
                'rows_skipped' => $report->skippedRows,
                'warnings' => $report->warnings,
                'finished_at' => now(),
                'status' => 'completed',
            ]);
        } catch (Throwable $e) {
            $batch->update([
                'status' => 'failed',
                'finished_at' => now(),
                'warnings' => ['error' => $e->getMessage()],
            ]);
            throw $e;
        }

        return $batch;
    }

    public function importFromPortal(?int $userId = null, bool $dryRun = false, ?PortalTrainingClient $client = null): ImportBatch
    {
        $client = $client ?? app(PortalTrainingClient::class);

        // Fetch all rows from API before touching database
        $apiRows = $client->fetchAll();
        $mappedRows = array_map(fn ($row) => $client->mapRow($row), $apiRows);

        $report = new ImportReport;

        if ($dryRun) {
            $this->loadLookups();
            $this->processMappedRows($mappedRows, $report, true);

            return new ImportBatch([
                'user_id' => $userId,
                'type' => 'training',
                'filename' => 'Portal API (dry-run)',
                'status' => 'completed',
                'rows_total' => $report->totalRows,
                'rows_imported' => $report->importedRows,
                'rows_skipped' => $report->skippedRows,
                'warnings' => $report->warnings,
                'started_at' => now(),
                'finished_at' => now(),
            ]);
        }

        $batch = ImportBatch::create([
            'user_id' => $userId,
            'type' => 'training',
            'filename' => 'Portal API (training-records/export)',
            'status' => 'running',
            'started_at' => now(),
        ]);

        try {
            DB::transaction(function () use ($mappedRows, $report) {
                DB::table('training_records')->delete();

                $this->loadLookups();
                $this->processMappedRows($mappedRows, $report, false);
            });

            $batch->update([
                'rows_total' => $report->totalRows,
                'rows_imported' => $report->importedRows,
                'rows_skipped' => $report->skippedRows,
                'warnings' => $report->warnings,
                'finished_at' => now(),
                'status' => 'completed',
            ]);
        } catch (Throwable $e) {
            $batch->update([
                'status' => 'failed',
                'finished_at' => now(),
                'warnings' => ['error' => $e->getMessage()],
            ]);
            throw $e;
        }

        return $batch;
    }

    private function loadLookups(): void
    {
        $this->companyByKey = DB::table('companies')->get()->keyBy(fn ($c) => Clean::companyKey($c->name))->map->id->all();
        $this->aliasMap = DB::table('company_aliases')->pluck('company_id', 'alias')->all();
        $this->employeeIds = DB::table('employees')->pluck('id', 'employee_id')->all();
    }

    private function processFile(UploadedFile $file, ImportReport $report): void
    {
        $data = Excel::toArray(new GenericImport, $file);
        if (empty($data) || empty($data[0])) {
            throw new RuntimeException('File kosong atau tidak dapat dibaca');
        }

        $rows = $data[0];
        $header = array_map('trim', array_filter((array) $rows[0], fn ($v) => $v !== null));
        $expectedHeader = ['NIK', 'Nama', 'Jenis Kelamin', 'Nama PT', 'Department', 'lokasi Kerja', 'Group', 'REGION', 'GOL', 'Jabatan', 'Tgl', 'Bln', 'Thn', 'Jml Hari', 'Jam Pelatihan', 'Nama Pelatihan', 'Instruktur', 'Tempat Pelatihan', 'Reg / Non Reg', 'Keterangan', 'Internal/Eksternal', 'Level', 'Periode'];

        $missing = array_diff($expectedHeader, $header);
        if ($missing) {
            throw new RuntimeException('Kolom hilang: '.implode(', ', $missing));
        }

        $count = count($header);
        $mappedRows = [];

        for ($i = 1; $i < count($rows); $i++) {
            $r = $rows[$i];

            if (empty(array_filter($r, fn ($val) => $val !== null && $val !== ''))) {
                continue;
            }

            $r = array_pad($r, $count, null);
            $mappedRows[] = array_combine($header, array_slice($r, 0, $count));
        }

        $this->processMappedRows($mappedRows, $report, false);
    }

    private function processMappedRows(array $mappedRows, ImportReport $report, bool $dryRun = false): void
    {
        $insertBatch = [];

        foreach ($mappedRows as $row) {
            $report->totalRows++;

            $month = Clean::month($row['Bln']);
            $year = (int) trim((string) $row['Thn']);
            if (! $month || ! $year) {
                $report->skippedRows++;
                $report->addWarning('missing_date', 'Tanpa bulan/tahun', "Baris {$report->totalRows}");

                continue;
            }

            $nikRaw = substr(trim((string) $row['NIK']), 0, 40) ?: null;
            $nikStatus = Clean::nikStatus($row['NIK']);
            $nik = Clean::nik($row['NIK']);

            if ($nikStatus === 'empty') {
                $report->addWarning('nik_empty', 'NIK kosong atau "-"', $nikRaw);
            } elseif ($nikStatus === 'corrupt') {
                $report->addWarning('nik_corrupt', 'NIK rusak (notasi ilmiah)', $nikRaw);
            } elseif ($nikStatus === 'invalid') {
                $report->addWarning('nik_invalid', 'NIK tidak valid (huruf)', $nikRaw);
            }

            $empId = $nik ? ($this->employeeIds[$nik] ?? null) : null;
            if ($nik && ! $empId) {
                $report->addWarning('nik_unmatched', 'NIK rapi tetapi tidak ditemukan di data Karyawan', $nik);
            }

            $rawPt = trim((string) $row['Nama PT']);
            $key = Clean::companyKey($rawPt);
            $companyId = $this->aliasMap[$key] ?? $this->companyByKey[$key] ?? null;

            if ($key !== '' && ! array_key_exists($key, $this->aliasMap)) {
                if (! $dryRun) {
                    DB::table('company_aliases')->insertOrIgnore([
                        'alias' => $key,
                        'company_id' => $companyId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
                $this->aliasMap[$key] = $companyId;
            }

            if (! $companyId && $key !== '') {
                $report->addWarning('company_unmapped', 'Alias PT belum terpetakan', $rawPt);
            }

            $hours = is_numeric($row['Jam Pelatihan']) ? (float) $row['Jam Pelatihan'] : 0.0;
            if ($hours == 0) {
                $report->addWarning('hours_zero', 'Jam pelatihan 0', "Baris {$report->totalRows}");
            }

            if (! $dryRun) {
                $insertBatch[] = [
                    'nik' => $nik,
                    'nik_raw' => $nikRaw,
                    'nik_status' => $nikStatus,
                    'employee_id' => $empId,
                    'company_id' => $companyId,
                    'participant_name' => trim((string) $row['Nama']),
                    'gender' => trim((string) $row['Jenis Kelamin']) ?: null,
                    'company_name_raw' => $rawPt ?: null,
                    'department' => trim((string) $row['Department']) ?: null,
                    'work_location' => trim((string) $row['lokasi Kerja']) ?: null,
                    'group' => trim((string) $row['Group']) ?: null,
                    'region' => Clean::region($row['REGION']),
                    'grade' => trim((string) $row['GOL']) ?: null,
                    'position' => trim((string) $row['Jabatan']) ?: null,
                    'year' => $year,
                    'month' => $month,
                    'days' => is_numeric($row['Jml Hari']) ? (int) $row['Jml Hari'] : null,
                    'hours' => $hours,
                    'training_name' => trim((string) $row['Nama Pelatihan']),
                    'instructor' => trim((string) $row['Instruktur']) ?: null,
                    'venue' => trim((string) $row['Tempat Pelatihan']) ?: null,
                    'regularity' => Clean::regularity($row['Reg / Non Reg']),
                    'note' => trim((string) $row['Keterangan']) ?: null,
                    'source_type' => trim((string) $row['Internal/Eksternal']) ?: null,
                    'level' => Clean::level($row['Level']),
                    'period' => substr(trim((string) $row['Periode']), 0, 5) ?: null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                if (count($insertBatch) >= 500) {
                    DB::table('training_records')->insert($insertBatch);
                    $insertBatch = [];
                }
            }

            $report->importedRows++;
        }

        if (! $dryRun && $insertBatch) {
            DB::table('training_records')->insert($insertBatch);
        }
    }
}
