<?php

namespace App\Services\Import;

use App\Imports\GenericImport;
use App\Models\ImportBatch;
use App\Support\Clean;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use RuntimeException;
use Throwable;

class EmployeeImporter
{
    public const COMPANY_DEFAULTS = [
        'R01' => ['group' => 'FR', 'region' => 'Riau'],
        'R02' => ['group' => 'FR', 'region' => 'Riau'],
        'R03' => ['group' => 'FR', 'region' => 'Riau'],
        'R04' => ['group' => 'FR', 'region' => 'Riau'],
        'R05' => ['group' => 'FR', 'region' => 'Riau'],
        'R06' => ['group' => 'FR', 'region' => 'Riau'],
        'R07' => ['group' => 'FR', 'region' => 'Riau'],
        'R08' => ['group' => 'FR', 'region' => 'Riau'],
        'R09' => ['group' => 'FR', 'region' => 'Riau'],
        'R10' => ['group' => 'FR', 'region' => 'Riau'],
        'R11' => ['group' => 'FR', 'region' => 'Riau'],
        'R12' => ['group' => 'FR', 'region' => 'Riau'],
        'R13' => ['group' => 'FR', 'region' => 'Riau'],
        'R14' => ['group' => 'FR', 'region' => 'Riau'],
        'R15' => ['group' => 'FR', 'region' => 'Riau'],
        'R16' => ['group' => 'FR', 'region' => 'Riau'],
        'R17' => ['group' => 'FR', 'region' => 'Riau'],
        'R18' => ['group' => 'FR', 'region' => 'Riau'],
        'R20' => ['group' => 'FR', 'region' => 'Riau'],
        'R21' => ['group' => 'FR', 'region' => 'Riau'],
        'R22' => ['group' => 'FR', 'region' => 'Riau'],
        'B01' => ['group' => 'FR', 'region' => 'Kalbar'],
        'B03' => ['group' => 'FR', 'region' => 'Kalbar'],
        'B04' => ['group' => 'FR', 'region' => 'Kalbar'],
        'B05' => ['group' => 'FR', 'region' => 'Kalbar'],
        'B06' => ['group' => 'FR', 'region' => 'Kalbar'],
        'B07' => ['group' => 'FR', 'region' => 'Kalbar'],
        'B08' => ['group' => 'FR', 'region' => 'Kalbar'],
        'B10' => ['group' => 'PO2', 'region' => 'Corp'],
        'L01' => ['group' => 'PO2', 'region' => 'Corp'],
        'L02' => ['group' => 'PO2', 'region' => 'Corp'],
        'U01' => ['group' => 'PO2', 'region' => 'Corp'],
        'U02' => ['group' => 'PO2', 'region' => 'Corp'],
        'U03' => ['group' => 'PO2', 'region' => 'Corp'],
        'T09' => ['group' => 'FR', 'region' => 'Kubar'],
        'T10' => ['group' => 'FR', 'region' => 'Kubar'],
        'T11' => ['group' => 'FR', 'region' => 'Kubar'],
        'T12' => ['group' => 'FR', 'region' => 'Kubar'],
        'T13' => ['group' => 'FR', 'region' => 'Kubar'],
        'T14' => ['group' => 'FR', 'region' => 'Kubar'],
        'T15' => ['group' => 'FR', 'region' => 'Kubar'],
        'T16' => ['group' => 'NON GROUP', 'region' => 'Non'],
        'J04' => ['group' => 'NON GROUP', 'region' => 'Non'],
        'J05' => ['group' => 'NON GROUP', 'region' => 'Non'],
    ];

    private array $companiesCache = [];

    private array $locationsCache = [];

    public function import(UploadedFile $file, ?int $userId = null, bool $replaceAll = false): ImportBatch
    {
        $batch = ImportBatch::create([
            'user_id' => $userId,
            'type' => 'employee',
            'filename' => $file->getClientOriginalName().($replaceAll ? ' (Ganti Total)' : ''),
            'status' => 'running',
            'started_at' => now(),
        ]);

        $report = new ImportReport;

        try {
            DB::transaction(function () use ($file, $report, $replaceAll) {
                if ($replaceAll) {
                    DB::table('training_records')->whereNotNull('employee_id')->update(['employee_id' => null]);
                    Storage::disk('public')->deleteDirectory('employees/photos');
                    DB::table('employees')->delete();
                }

                $this->companiesCache = DB::table('companies')->pluck('id', 'code')->all();
                $this->locationsCache = DB::table('locations')->pluck('id', 'code')->all();
                $this->processFile($file, $report);

                // Auto-relink training records to newly imported employees based on NIK
                $driver = DB::getDriverName();
                if ($driver === 'mysql') {
                    DB::statement("
                        UPDATE training_records tr
                        JOIN employees e ON tr.nik = e.employee_id
                        SET tr.employee_id = e.id
                        WHERE tr.employee_id IS NULL AND tr.nik IS NOT NULL AND tr.nik != ''
                    ");
                } else {
                    DB::statement("
                        UPDATE training_records
                        SET employee_id = (SELECT id FROM employees WHERE employees.employee_id = training_records.nik)
                        WHERE employee_id IS NULL AND nik IS NOT NULL AND nik != ''
                    ");
                }
            });

            Cache::flush();

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

    private function processFile(UploadedFile $file, ImportReport $report): void
    {
        $data = Excel::toArray(new GenericImport, $file);
        if (empty($data) || empty($data[0])) {
            throw new RuntimeException('File kosong atau tidak dapat dibaca');
        }

        $rows = $data[0];
        $header = array_map('trim', array_filter((array) $rows[0], fn ($v) => $v !== null));
        $expectedHeader = ['Employee ID', 'Employee Name', 'Join Date', 'Employment Type', 'Job Level Code', 'Job Title Code', 'Job Title Name', 'Organization Code', 'Organization Name', 'Location Code', 'Location Name', 'Company Code', 'Company Name', 'Birth Date', 'Birth Place', 'Gender', 'Marital Status', 'Religion', 'PTKP Code', 'PTKP Name', 'Group', 'Region'];

        $missing = array_diff($expectedHeader, $header);
        if ($missing) {
            throw new RuntimeException('Kolom hilang: '.implode(', ', $missing));
        }

        $count = count($header);

        $existingEmpIds = DB::table('employees')->pluck('employee_id')->all();
        $importedEmpIds = [];

        // Mulai dari baris ke-2 (index 1)
        for ($i = 1; $i < count($rows); $i++) {
            $r = $rows[$i];

            // Skip baris kosong
            if (empty(array_filter($r, fn ($val) => $val !== null && $val !== ''))) {
                continue;
            }

            $r = array_pad($r, $count, null);
            $row = array_combine($header, array_slice($r, 0, $count));

            $report->totalRows++;
            $employeeId = trim((string) $row['Employee ID']);
            if ($employeeId !== '') {
                $importedEmpIds[] = $employeeId;
            }
            $this->processRow($row, $report);
        }

        $missing = array_diff($existingEmpIds, $importedEmpIds);
        if ($missing) {
            $report->addWarning('missing_from_file', 'Karyawan ada di DB tapi tidak ada di file baru', count($missing).' karyawan, misal: '.implode(', ', array_slice($missing, 0, 5)));
        }
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
        [$group, $region] = $this->resolveGroupAndRegion($companyCode, $r['Group'] ?? null, $r['Region'] ?? null, $report, $employeeId);

        $companyName = trim((string) $r['Company Name']);
        if (str_starts_with($companyName, '=')) {
            $companyName = $companyCode;
        }

        if (! isset($this->companiesCache[$companyCode])) {
            $id = DB::table('companies')->insertGetId([
                'code' => $companyCode,
                'name' => $companyName,
                'group' => $group,
                'region' => $region,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $this->companiesCache[$companyCode] = $id;
        } else {
            DB::table('companies')->where('id', $this->companiesCache[$companyCode])->update([
                'name' => $companyName,
                'group' => $group,
                'region' => $region,
                'updated_at' => $now,
            ]);
        }
        $companyId = $this->companiesCache[$companyCode];

        $locationCode = trim((string) $r['Location Code']);
        $locationName = trim((string) $r['Location Name']);
        if (str_starts_with($locationName, '=')) {
            $locationName = $locationCode;
        }

        if (! isset($this->locationsCache[$locationCode])) {
            $id = DB::table('locations')->insertGetId([
                'code' => $locationCode,
                'name' => $locationName,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $this->locationsCache[$locationCode] = $id;
        } else {
            DB::table('locations')->where('id', $this->locationsCache[$locationCode])->update([
                'name' => $locationName,
                'updated_at' => $now,
            ]);
        }
        $locationId = $this->locationsCache[$locationCode];

        $birth = Clean::birth($r['Birth Date']);
        $join = Clean::join($r['Join Date']);

        if (! $birth || ! $join || $join->lt($birth->copy()->addYears(15)) || $join->isFuture()) {
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
                'group' => $group,
                'region' => $region,
                'updated_at' => $now,
            ]
        );

        $report->importedRows++;
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function resolveGroupAndRegion(string $companyCode, ?string $rawGroup, ?string $rawRegion, ImportReport $report, string $employeeId): array
    {
        $group = trim((string) $rawGroup);
        $region = trim((string) $rawRegion);

        $isGroupCorrupt = str_starts_with($group, '=') || str_starts_with($group, '#') || $group === '';
        $isRegionCorrupt = str_starts_with($region, '=') || str_starts_with($region, '#') || $region === '';

        if ($isGroupCorrupt || $isRegionCorrupt) {
            $default = self::COMPANY_DEFAULTS[$companyCode] ?? null;

            if (! $default) {
                $prefix = strtoupper(substr($companyCode, 0, 1));
                $default = match ($prefix) {
                    'R' => ['group' => 'FR', 'region' => 'Riau'],
                    'B' => ($companyCode === 'B10') ? ['group' => 'PO2', 'region' => 'Corp'] : ['group' => 'FR', 'region' => 'Kalbar'],
                    'T' => ($companyCode === 'T16') ? ['group' => 'NON GROUP', 'region' => 'Non'] : ['group' => 'FR', 'region' => 'Kubar'],
                    'U', 'L' => ['group' => 'PO2', 'region' => 'Corp'],
                    'J' => ['group' => 'NON GROUP', 'region' => 'Non'],
                    default => null,
                };
            }

            if ($default) {
                if ($isGroupCorrupt) {
                    $group = $default['group'];
                }
                if ($isRegionCorrupt) {
                    $region = $default['region'];
                }

                $report->addWarning(
                    'formula_or_empty_group_region',
                    'Kolom Group/Region berupa formula Excel atau kosong, otomatis dipulihkan ke nilai standar.',
                    "Employee ID: $employeeId ($companyCode -> Group: $group, Region: $region)"
                );
            }
        }

        return [$group, $region];
    }
}
