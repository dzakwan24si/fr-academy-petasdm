<?php

namespace App\Services\Portal;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class PortalTrainingClient
{
    /**
     * Ambil seluruh data training dari Portal API dengan paginasi.
     *
     * @return array Array dari baris data mentah API
     *
     * @throws RuntimeException
     */
    public function fetchAll(): array
    {
        $url = config('services.portal.url');
        $token = config('services.portal.token');
        $timeout = (int) config('services.portal.timeout', 30);

        if (empty($url) || empty($token)) {
            throw new RuntimeException('Koneksi portal belum dikonfigurasi.');
        }

        $endpoint = rtrim($url, '/').'/api/v1/training-records/export';

        $page = 1;
        $lastPage = 1;
        $allRows = [];
        $expectedTotal = null;

        do {
            try {
                $response = Http::withToken($token)
                    ->acceptJson()
                    ->timeout($timeout)
                    ->retry(3, 500)
                    ->get($endpoint, [
                        'per_page' => 1000,
                        'page' => $page,
                    ]);
            } catch (Throwable $e) {
                throw new RuntimeException('Gagal terhubung ke Portal API: HTTP request error.');
            }

            if (! $response->successful()) {
                throw new RuntimeException("Gagal mengambil data dari Portal API (Status: {$response->status()}).");
            }

            $data = $response->json();
            if (! is_array($data) || ! isset($data['data']) || ! is_array($data['data'])) {
                throw new RuntimeException('Format respon dari Portal API tidak valid.');
            }

            if ($page === 1) {
                $meta = $data['meta'] ?? [];
                $expectedTotal = isset($meta['total']) ? (int) $meta['total'] : null;
                $lastPage = isset($meta['last_page']) ? (int) $meta['last_page'] : 1;
            }

            foreach ($data['data'] as $row) {
                $allRows[] = (array) $row;
            }

            $page++;
        } while ($page <= $lastPage);

        if ($expectedTotal !== null && count($allRows) !== $expectedTotal) {
            throw new RuntimeException('Jumlah baris portal ('.count($allRows).') tidak cocok dengan meta total ('.$expectedTotal.').');
        }

        if (count($allRows) === 0 && DB::table('training_records')->exists()) {
            throw new RuntimeException('Portal mengembalikan 0 data training, sinkronisasi dibatalkan untuk melindungi data lokal.');
        }

        return $allRows;
    }

    /**
     * Memetakan field API ke kunci header Excel.
     *
     * @param  array  $api  Baris data dari API portal
     * @return array Baris data berkunci header Excel
     */
    public function mapRow(array $api): array
    {
        return [
            'NIK' => isset($api['nik']) ? (string) $api['nik'] : '',
            'Nama' => $api['nama'] ?? '',
            'Jenis Kelamin' => $api['jenis_kelamin'] ?? '',
            'Nama PT' => $api['nama_pt'] ?? '',
            'Department' => $api['department'] ?? '',
            'lokasi Kerja' => $api['lokasi_kerja'] ?? '',
            'Group' => $api['group'] ?? '',
            'REGION' => $api['region'] ?? '',
            'GOL' => $api['gol'] ?? '',
            'Jabatan' => $api['jabatan'] ?? '',
            'Tgl' => null,
            'Bln' => $api['bulan'] ?? '',
            'Thn' => isset($api['tahun']) ? (string) $api['tahun'] : '',
            'Jml Hari' => $api['jml_hari'] ?? null,
            'Jam Pelatihan' => $api['jam_pelatihan'] ?? 0,
            'Nama Pelatihan' => $api['nama_pelatihan'] ?? '',
            'Instruktur' => $api['instruktur'] ?? '',
            'Tempat Pelatihan' => $api['tempat_pelatihan'] ?? '',
            'Reg / Non Reg' => $api['reg_non_reg'] ?? '',
            'Keterangan' => null,
            'Internal/Eksternal' => $api['internal_eksternal'] ?? '',
            'Level' => $api['level'] ?? '',
            'Periode' => $api['periode'] ?? '',
        ];
    }
}
