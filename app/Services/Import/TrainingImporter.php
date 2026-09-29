<?php

namespace App\Services\Import;

use App\Models\ImportBatch;
use App\Support\Clean;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class TrainingImporter
{
    private array $companyByKey = [];
    private array $aliasMap = [];
    private array $employeeIds = [];

    public function import(string $path, ?int $userId = null): ImportBatch
    {
        $batch = ImportBatch::create([
            'user_id' => $userId,
            'type' => 'training',
            'filename' => basename($path),
            'status' => 'running',
            'started_at' => now(),
        ]);

        $report = new ImportReport();

        try {
            DB::transaction(function () use ($path, $report) {
                // Delete existing records
                DB::table('training_records')->delete();
                
                $this->companyByKey = DB::table('companies')->get()->keyBy(fn($c) => Clean::companyKey($c->name))->map->id->all();
                $this->aliasMap = DB::table('company_aliases')->pluck('company_id', 'alias')->all();
                $this->employeeIds = DB::table('employees')->pluck('id', 'employee_id')->all();
                
                $this->processFile($path, $report);
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

    private function processFile(string $path, ImportReport $report): void
    {
        $fh = fopen($path, 'r');
        if (!$fh) {
            throw new RuntimeException("Tidak bisa membuka $path");
        }

        if (fread($fh, 3) !== "\xEF\xBB\xBF") {
            rewind($fh);
        }

        $header = array_map('trim', fgetcsv($fh, 0, ';') ?: []);
        $expectedHeader = ['NIK', 'Nama', 'Jenis Kelamin', 'Nama PT', 'Department', 'lokasi Kerja', 'Group', 'REGION', 'GOL', 'Jabatan', 'Tgl', 'Bln', 'Thn', 'Jml Hari', 'Jam Pelatihan', 'Nama Pelatihan', 'Instruktur', 'Tempat Pelatihan', 'Reg / Non Reg', 'Keterangan', 'Internal/Eksternal', 'Level', 'Periode'];
        
        $missing = array_diff($expectedHeader, $header);
        if ($missing) {
            throw new RuntimeException('Kolom hilang: ' . implode(', ', $missing));
        }

        $count = count($header);
        $insertBatch = [];

        while (($r = fgetcsv($fh, 0, ';')) !== false) {
            if ($r === [null]) {
                continue;
            }
            $r = array_pad($r, $count, null);
            $row = array_combine($header, array_slice($r, 0, $count));
            foreach ($row as $k => $v) {
                if (is_string($v) && !mb_check_encoding($v, 'UTF-8')) {
                    $row[$k] = mb_convert_encoding($v, 'UTF-8', 'ISO-8859-1');
                }
            }
            
            $report->totalRows++;
            
            $month = Clean::month($row['Bln']);
            $year = (int) trim((string) $row['Thn']);
            if (!$month || !$year) {
                $report->skippedRows++;
                $report->addWarning('missing_date', 'Tanpa bulan/tahun', "Baris {$report->totalRows}");
                continue;
            }

            $nikRaw = substr(trim((string) $row['NIK']), 0, 40) ?: null;
            $nikStatus = Clean::nikStatus($row['NIK']);
            $nik = Clean::nik($row['NIK']);
            
            if ($nikStatus === 'empty') $report->addWarning('nik_empty', 'NIK kosong atau "-"', $nikRaw);
            elseif ($nikStatus === 'corrupt') $report->addWarning('nik_corrupt', 'NIK rusak (notasi ilmiah)', $nikRaw);
            elseif ($nikStatus === 'invalid') $report->addWarning('nik_invalid', 'NIK tidak valid (huruf)', $nikRaw);

            $empId = $nik ? ($this->employeeIds[$nik] ?? null) : null;
            if ($nik && !$empId) {
                $report->addWarning('nik_unmatched', 'NIK rapi tetapi tidak ditemukan di data Karyawan', $nik);
            }

            $rawPt = trim((string) $row['Nama PT']);
            $key = Clean::companyKey($rawPt);
            $companyId = $this->aliasMap[$key] ?? $this->companyByKey[$key] ?? null;
            
            if ($key !== '' && !array_key_exists($key, $this->aliasMap)) {
                DB::table('company_aliases')->insertOrIgnore([
                    'alias' => $key,
                    'company_id' => $companyId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $this->aliasMap[$key] = $companyId;
            }
            
            if (!$companyId && $key !== '') {
                $report->addWarning('company_unmapped', 'Alias PT belum terpetakan', $rawPt);
            }

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
                'hours' => is_numeric($row['Jam Pelatihan']) ? (float) $row['Jam Pelatihan'] : 0,
                'training_name' => trim((string) $row['Nama Pelatihan']),
                'instructor' => trim((string) $row['Instruktur']) ?: null,
                'venue' => trim((string) $row['Tempat Pelatihan']) ?: null,
                'regularity' => Clean::regularity($row['Reg / Non Reg']),
                'note' => trim((string) $row['Keterangan']) ?: null,
                'source_type' => trim((string) $row['Internal/Eksternal']) ?: null,
                'level' => Clean::level($row['Level']),
                'period' => trim((string) $row['Periode']) ?: null,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            if (count($insertBatch) >= 500) {
                DB::table('training_records')->insert($insertBatch);
                $insertBatch = [];
            }
            $report->importedRows++;
        }

        if ($insertBatch) {
            DB::table('training_records')->insert($insertBatch);
        }

        fclose($fh);
    }
}
