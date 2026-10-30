<?php

namespace App\Services\Import;

use App\Imports\GenericImport;
use App\Models\StaffResign;
use Carbon\Carbon;
use DateTimeInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use RuntimeException;
use Throwable;

class StaffResignImporter
{
    /**
     * Import resignation data from uploaded file (xlsx, xls, csv).
     *
     * @return array{success: bool, total: int, imported: int, updated: int, skipped: int, errors: array}
     */
    public function import(UploadedFile $file, string $mode = 'append'): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $rows = [];

        if (in_array($extension, ['csv', 'txt'])) {
            $rows = $this->readCsv($file);
        } else {
            $data = Excel::toArray(new GenericImport, $file);
            if (empty($data) || empty($data[0])) {
                throw new RuntimeException('File Excel kosong atau tidak dapat dibaca.');
            }
            $rows = $data[0];
        }

        if (empty($rows)) {
            throw new RuntimeException('Tidak ada data baris yang ditemukan dalam file.');
        }

        // Auto detect header row (within first 15 rows)
        $headerIndex = null;
        $headerMap = [];

        foreach (array_slice($rows, 0, 15, true) as $idx => $row) {
            $map = $this->resolveHeaderMap($row);
            if (isset($map['nama']) || (isset($map['employee_id']) && isset($map['resign_date']))) {
                $headerIndex = $idx;
                $headerMap = $map;
                break;
            }
        }

        if ($headerIndex === null) {
            throw new RuntimeException('Header kolom tidak dikenali. Pastikan file memiliki minimal kolom "Nama Karyawan" atau "NIK" dan "Tgl Resign".');
        }

        $dataRows = array_slice($rows, $headerIndex + 1);
        if (empty($dataRows)) {
            throw new RuntimeException('File hanya berisi header tanpa ada baris data karyawan.');
        }

        $imported = 0;
        $updated = 0;
        $skipped = 0;
        $total = 0;
        $errors = [];

        DB::transaction(function () use ($dataRows, $headerMap, $mode, &$imported, &$updated, &$skipped, &$total, &$errors) {
            if ($mode === 'replace') {
                StaffResign::truncate();
            }

            foreach ($dataRows as $rowIdx => $row) {
                // Check if row is empty
                $rowValues = array_filter($row, fn ($v) => $v !== null && trim((string) $v) !== '');
                if (empty($rowValues)) {
                    continue;
                }

                $total++;
                $actualRowNumber = $rowIdx + 2;

                $rawName = $this->getValue($row, $headerMap, 'nama');
                $rawNik = $this->getValue($row, $headerMap, 'employee_id');

                if (empty($rawName) && empty($rawNik)) {
                    $skipped++;

                    continue;
                }

                $nama = ! empty($rawName) ? trim((string) $rawName) : 'Karyawan (NIK: '.$rawNik.')';
                $employeeId = ! empty($rawNik) ? trim((string) $rawNik) : null;

                $rawResignDate = $this->getValue($row, $headerMap, 'resign_date');
                $resignDate = $this->parseDate($rawResignDate);

                if (! $resignDate) {
                    $errors[] = "Baris {$actualRowNumber}: Tanggal resign ({$rawResignDate}) tidak valid, baris dilewati.";
                    $skipped++;

                    continue;
                }

                $rawJoinDate = $this->getValue($row, $headerMap, 'join_date');
                $joinDate = $this->parseDate($rawJoinDate);

                $jabatan = $this->getValue($row, $headerMap, 'jabatan') ?: '-';
                $kebun = $this->getValue($row, $headerMap, 'kebun') ?: '-';
                $rawRegion = $this->getValue($row, $headerMap, 'region') ?: 'Riau';
                $rawJenis = $this->getValue($row, $headerMap, 'jenis_resign') ?: 'VOLUNTARY';
                $rawCluster = $this->getValue($row, $headerMap, 'cluster_resign') ?: 'Lainnya';
                $rawAlumni = $this->getValue($row, $headerMap, 'alumni') ?: 'Non Alumni';
                $deskripsiResign = $this->getValue($row, $headerMap, 'deskripsi_resign');
                $keterangan = $this->getValue($row, $headerMap, 'keterangan');

                // Normalizations
                $region = $this->normalizeRegion($rawRegion);
                $jenisResign = $this->normalizeJenisResign($rawJenis);
                $clusterResign = $this->normalizeClusterResign($rawCluster);
                $alumni = $this->normalizeAlumni($rawAlumni);

                $recordData = [
                    'employee_id' => $employeeId,
                    'nama' => $nama,
                    'join_date' => $joinDate,
                    'resign_date' => $resignDate,
                    'jabatan' => trim((string) $jabatan),
                    'kebun' => trim((string) $kebun),
                    'region' => $region,
                    'jenis_resign' => $jenisResign,
                    'cluster_resign' => $clusterResign,
                    'alumni' => $alumni,
                    'deskripsi_resign' => $deskripsiResign ? trim((string) $deskripsiResign) : null,
                    'keterangan' => $keterangan ? trim((string) $keterangan) : null,
                ];

                if ($mode === 'replace') {
                    StaffResign::create($recordData);
                    $imported++;
                } else {
                    // Check duplicate for upsert/append
                    $query = StaffResign::query()->where('resign_date', $resignDate);
                    if (! empty($employeeId)) {
                        $query->where(function ($q) use ($employeeId, $nama) {
                            $q->where('employee_id', $employeeId)->orWhere('nama', $nama);
                        });
                    } else {
                        $query->where('nama', $nama);
                    }

                    $existing = $query->first();

                    if ($existing) {
                        $existing->update($recordData);
                        $updated++;
                    } else {
                        StaffResign::create($recordData);
                        $imported++;
                    }
                }
            }
        });

        return [
            'success' => true,
            'total' => $total,
            'imported' => $imported,
            'updated' => $updated,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    private function readCsv(UploadedFile $file): array
    {
        $path = $file->getRealPath();
        $handle = fopen($path, 'r');
        if (! $handle) {
            throw new RuntimeException('Gagal membuka file CSV.');
        }

        // Read first line to detect delimiter (comma or semicolon)
        $firstLine = fgets($handle);
        rewind($handle);

        $delimiter = ';';
        if ($firstLine !== false && substr_count($firstLine, ',') > substr_count($firstLine, ';')) {
            $delimiter = ',';
        }

        $rows = [];
        while (($data = fgetcsv($handle, 0, $delimiter)) !== false) {
            $rows[] = $data;
        }

        fclose($handle);

        return $rows;
    }

    private function resolveHeaderMap(array $row): array
    {
        $map = [];

        foreach ($row as $colIdx => $headerVal) {
            if ($headerVal === null) {
                continue;
            }

            $clean = strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', '', (string) $headerVal)));

            if (in_array($clean, ['nik', 'employeeid', 'id', 'nip'])) {
                $map['employee_id'] = $colIdx;
            } elseif (in_array($clean, ['nama', 'namakaryawan', 'employeename', 'name'])) {
                $map['nama'] = $colIdx;
            } elseif (in_array($clean, ['tgljoin', 'joindate', 'tanggaljoin', 'tglmasuk', 'tanggalmasuk'])) {
                $map['join_date'] = $colIdx;
            } elseif (in_array($clean, ['tglresign', 'resigndate', 'tanggalresign', 'tglkeluar', 'tanggalkeluar', 'resign'])) {
                $map['resign_date'] = $colIdx;
            } elseif (in_array($clean, ['jabatan', 'jobtitle', 'posisi', 'jobtitlename'])) {
                $map['jabatan'] = $colIdx;
            } elseif (in_array($clean, ['kebun', 'unit', 'lokasi', 'lokasikerja', 'estate'])) {
                $map['kebun'] = $colIdx;
            } elseif (in_array($clean, ['region', 'wilayah'])) {
                $map['region'] = $colIdx;
            } elseif (in_array($clean, ['jenisresign', 'jenis', 'voluntaryinvoluntary', 'statusresign'])) {
                $map['jenis_resign'] = $colIdx;
            } elseif (in_array($clean, ['clusterresign', 'cluster', 'klaster', 'klasterresign', 'kategori'])) {
                $map['cluster_resign'] = $colIdx;
            } elseif (in_array($clean, ['alumni', 'statusalumni'])) {
                $map['alumni'] = $colIdx;
            } elseif (in_array($clean, ['alasanresign', 'deskripsiresign', 'alasan', 'keteranganresign', 'reason'])) {
                $map['deskripsi_resign'] = $colIdx;
            } elseif (in_array($clean, ['keterangan', 'catatan', 'notes', 'remark'])) {
                $map['keterangan'] = $colIdx;
            }
        }

        return $map;
    }

    private function getValue(array $row, array $map, string $key): mixed
    {
        if (! isset($map[$key])) {
            return null;
        }

        $colIdx = $map[$key];

        return $row[$colIdx] ?? null;
    }

    private function parseDate(mixed $val): ?string
    {
        if ($val === null || $val === '') {
            return null;
        }

        if ($val instanceof DateTimeInterface) {
            return Carbon::instance($val)->format('Y-m-d');
        }

        // Numeric Excel date serial
        if (is_numeric($val) && (float) $val > 25569 && (float) $val < 65000) {
            try {
                return Carbon::instance(ExcelDate::excelToDateTimeObject((float) $val))->format('Y-m-d');
            } catch (Throwable) {
                // Fallback
            }
        }

        $str = trim((string) $val);

        // Try standard formats
        $formats = ['Y-m-d', 'd/m/Y', 'd-m-Y', 'Y/m/d', 'm/d/Y', 'd M Y', 'd-M-Y', 'd F Y'];
        foreach ($formats as $fmt) {
            try {
                $d = Carbon::createFromFormat($fmt, $str);
                if ($d && $d->format($fmt) === $str) {
                    return $d->format('Y-m-d');
                }
            } catch (Throwable) {
                continue;
            }
        }

        try {
            return Carbon::parse($str)->format('Y-m-d');
        } catch (Throwable) {
            return null;
        }
    }

    private function normalizeRegion(mixed $val): string
    {
        $str = strtolower(trim((string) $val));
        if (str_contains($str, 'kubar') || str_contains($str, 'kaltim')) {
            return 'Kaltim';
        }
        if (str_contains($str, 'kalbar')) {
            return 'Kalbar';
        }

        return 'Riau';
    }

    private function normalizeJenisResign(mixed $val): string
    {
        $str = strtoupper(trim((string) $val));
        if (str_contains($str, 'INVOLUNTARY')) {
            return 'INVOLUNTARY';
        }

        return 'VOLUNTARY';
    }

    private function normalizeClusterResign(mixed $val): string
    {
        $raw = trim((string) $val);
        if ($raw === '') {
            return 'Lainnya';
        }

        $clusterMap = [
            'pindah perusahaan' => 'Pindah Perusahaan',
            'working condition' => 'Working Condition',
            'under perform' => 'Under Perform',
            'keluarga' => 'Keluarga',
            'efisiensi' => 'Efisiensi',
            'kasus' => 'Kasus',
            'meninggalkan kebun tanpa keterangan' => 'Meninggalkan Kebun Tanpa Keterangan',
            'hbs kontrak' => 'Hbs Kontrak',
            'indisipliner' => 'Indisipliner',
        ];

        $lower = strtolower($raw);
        if (isset($clusterMap[$lower])) {
            return $clusterMap[$lower];
        }

        return ucwords($lower);
    }

    private function normalizeAlumni(mixed $val): string
    {
        $str = strtolower(trim((string) $val));
        if (str_contains($str, 'alumni') && ! str_contains($str, 'non')) {
            return 'Alumni';
        }

        return 'Non Alumni';
    }
}
