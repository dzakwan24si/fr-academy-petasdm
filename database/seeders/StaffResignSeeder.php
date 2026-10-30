<?php

namespace Database\Seeders;

use App\Models\StaffResign;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class StaffResignSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $csvPath = database_path('data/staff_resigns.csv');
        if (! file_exists($csvPath)) {
            $this->command->error("File {$csvPath} not found.");

            return;
        }

        StaffResign::truncate();

        $file = fopen($csvPath, 'r');
        $header = fgetcsv($file, 0, ';');

        $inserted = 0;
        $batch = [];

        while (($row = fgetcsv($file, 0, ';')) !== false) {
            // Check if row has employee_id or nama
            if (empty($row[0]) && empty($row[1])) {
                continue;
            }

            $employeeId = ! empty($row[0]) ? trim($row[0]) : null;
            $nama = ! empty($row[1]) ? trim($row[1]) : '';
            if (empty($nama)) {
                continue;
            }

            $joinDateStr = ! empty($row[2]) ? trim($row[2]) : null;
            $resignDateStr = ! empty($row[3]) ? trim($row[3]) : null;
            $jabatan = ! empty($row[4]) ? trim($row[4]) : '-';
            $kebun = ! empty($row[5]) ? trim($row[5]) : '-';
            $deskripsiResign = ! empty($row[6]) ? trim($row[6]) : null;
            $jenisResign = ! empty($row[7]) ? strtoupper(trim($row[7])) : 'VOLUNTARY';
            $clusterResign = ! empty($row[8]) ? trim($row[8]) : 'Lainnya';
            $alumni = ! empty($row[9]) ? trim($row[9]) : 'Non Alumni';
            $keterangan = ! empty($row[10]) ? trim($row[10]) : null;
            $region = ! empty($row[11]) ? trim($row[11]) : 'Riau';

            // Normalize cluster casing
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
            $clusterLower = strtolower($clusterResign);
            if (isset($clusterMap[$clusterLower])) {
                $clusterResign = $clusterMap[$clusterLower];
            }

            // Normalize region
            if (strcasecmp($region, 'Kubar') === 0) {
                $region = 'Kaltim';
            }

            // Normalize alumni
            if (stripos($alumni, 'Alumni') !== false && stripos($alumni, 'Non') === false) {
                $alumni = 'Alumni';
            } else {
                $alumni = 'Non Alumni';
            }

            // Normalize jenis_resign
            if (stripos($jenisResign, 'INVOLUNTARY') !== false) {
                $jenisResign = 'INVOLUNTARY';
            } else {
                $jenisResign = 'VOLUNTARY';
            }

            $joinDate = $this->parseDate($joinDateStr);
            $resignDate = $this->parseDate($resignDateStr);

            if (! $resignDate) {
                // If resign date is invalid, fallback to joinDate or now
                $resignDate = $joinDate ?: '2026-01-01';
            }

            $batch[] = [
                'employee_id' => $employeeId,
                'nama' => $nama,
                'join_date' => $joinDate,
                'resign_date' => $resignDate,
                'jabatan' => $jabatan,
                'kebun' => $kebun,
                'deskripsi_resign' => $deskripsiResign,
                'jenis_resign' => $jenisResign,
                'cluster_resign' => $clusterResign,
                'alumni' => $alumni,
                'keterangan' => $keterangan,
                'region' => $region,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            if (count($batch) >= 100) {
                StaffResign::insert($batch);
                $inserted += count($batch);
                $batch = [];
            }
        }

        if (count($batch) > 0) {
            StaffResign::insert($batch);
            $inserted += count($batch);
        }

        fclose($file);

        $this->command->info("Successfully seeded {$inserted} staff resignation records.");
    }

    private function parseDate(?string $dateStr): ?string
    {
        if (empty($dateStr)) {
            return null;
        }

        $dateStr = trim($dateStr);

        try {
            return Carbon::parse($dateStr)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }
}
