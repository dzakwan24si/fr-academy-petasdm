<?php

namespace App\Services\Import;

use App\Models\ImportBatch;
use App\Support\Clean;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class EmployeeImporter
{
    private array $companiesCache = [];
    private array $locationsCache = [];

    public function import(string $path, ?int $userId = null): ImportBatch
    {
        $batch = ImportBatch::create([
            'user_id' => $userId,
            'type' => 'employee',
            'filename' => basename($path),
            'status' => 'running',
            'started_at' => now(),
        ]);

        $report = new ImportReport();

        try {
            DB::transaction(function () use ($path, $report) {
                $this->companiesCache = DB::table('companies')->pluck('id', 'code')->all();
                $this->locationsCache = DB::table('locations')->pluck('id', 'code')->all();
                $this->processFile($path, $report);
            });

            try {
                $batch->update([
                    'rows_total' => $report->totalRows,
                    'rows_imported' => $report->importedRows,
                    'rows_skipped' => $report->skippedRows,
                    'warnings' => $report->warnings,
                    'finished_at' => now(),
                    'status' => 'completed',
                ]);
            } catch (Throwable $e) {
                file_put_contents('warnings_dump.json', json_encode($report->warnings, JSON_PARTIAL_OUTPUT_ON_ERROR));
                file_put_contents('warnings_dump.txt', print_r($report->warnings, true));
                throw $e;
            }
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
        $expectedHeader = ['Employee ID', 'Employee Name', 'Join Date', 'Employment Type', 'Job Level Code', 'Job Title Code', 'Job Title Name', 'Organization Code', 'Organization Name', 'Location Code', 'Location Name', 'Company Code', 'Company Name', 'Birth Date', 'Birth Place', 'Gender', 'Marital Status', 'Religion', 'PTKP Code', 'PTKP Name', 'Group', 'Region'];
        
        $missing = array_diff($expectedHeader, $header);
        if ($missing) {
            throw new RuntimeException('Kolom hilang: ' . implode(', ', $missing));
        }

        $count = count($header);

        $existingEmpIds = DB::table('employees')->pluck('employee_id')->all();
        $importedEmpIds = [];

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
            $employeeId = trim((string) $row['Employee ID']);
            if ($employeeId !== '') {
                $importedEmpIds[] = $employeeId;
            }
            $this->processRow($row, $report);
        }

        $missing = array_diff($existingEmpIds, $importedEmpIds);
        if ($missing) {
            $report->addWarning('missing_from_file', 'Karyawan ada di DB tapi tidak ada di file baru', count($missing) . ' karyawan, misal: ' . implode(', ', array_slice($missing, 0, 5)));
        }

        fclose($fh);
    }

    private function processRow(array $r, ImportReport $report): void
    {
        $now = now();
        $employeeId = trim((string) $r['Employee ID']);
        
        if ($employeeId === '') {
            $report->skippedRows++;
            $report->addWarning('missing_employee_id', 'Baris tanpa Employee ID');
            return;
        }

        $companyCode = trim((string) $r['Company Code']);
        if (!isset($this->companiesCache[$companyCode])) {
            $id = DB::table('companies')->insertGetId([
                'code' => $companyCode,
                'name' => trim((string) $r['Company Name']),
                'group' => trim((string) $r['Group']),
                'region' => trim((string) $r['Region']),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $this->companiesCache[$companyCode] = $id;
        } else {
            DB::table('companies')->where('id', $this->companiesCache[$companyCode])->update([
                'name' => trim((string) $r['Company Name']),
                'group' => trim((string) $r['Group']),
                'region' => trim((string) $r['Region']),
                'updated_at' => $now,
            ]);
        }
        $companyId = $this->companiesCache[$companyCode];

        $locationCode = trim((string) $r['Location Code']);
        if (!isset($this->locationsCache[$locationCode])) {
            $id = DB::table('locations')->insertGetId([
                'code' => $locationCode,
                'name' => trim((string) $r['Location Name']),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $this->locationsCache[$locationCode] = $id;
        } else {
            DB::table('locations')->where('id', $this->locationsCache[$locationCode])->update([
                'name' => trim((string) $r['Location Name']),
                'updated_at' => $now,
            ]);
        }
        $locationId = $this->locationsCache[$locationCode];

        $birth = Clean::birth($r['Birth Date']);
        $join = Clean::join($r['Join Date']);

        if (!$birth || !$join || $join->lt($birth->copy()->addYears(15)) || $join->isFuture()) {
            $report->addWarning('suspicious_dates', 'Tanggal lahir/masuk mencurigakan', "Employee ID: $employeeId");
        }

        DB::table('employees')->updateOrInsert(
            ['employee_id' => $employeeId],
            [
                'name' => trim((string) $r['Employee Name']),
                'join_date' => $join?->toDateString(),
                'birth_date' => $birth?->toDateString(),
                'birth_place' => trim((string) $r['Birth Place']) ?: null,
                'employment_type' => trim((string) $r['Employment Type']),
                'job_level_code' => trim((string) $r['Job Level Code']),
                'job_title_code' => trim((string) $r['Job Title Code']),
                'job_title_name' => trim((string) $r['Job Title Name']),
                'organization_code' => trim((string) $r['Organization Code']),
                'organization_name' => trim((string) $r['Organization Name']),
                'company_id' => $companyId,
                'location_id' => $locationId,
                'gender' => trim((string) $r['Gender']),
                'marital_status' => trim((string) $r['Marital Status']),
                'religion' => trim((string) $r['Religion']),
                'ptkp_code' => trim((string) $r['PTKP Code']),
                'ptkp_name' => trim((string) $r['PTKP Name']),
                'group' => trim((string) $r['Group']),
                'region' => trim((string) $r['Region']),
                'updated_at' => $now,
            ]
        );
        
        $report->importedRows++;
    }
}
