<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StaffResignTemplateExport implements FromArray, WithColumnWidths, WithHeadings, WithStyles
{
    public function headings(): array
    {
        return [
            'NIK',
            'Nama Karyawan',
            'Tgl Join (YYYY-MM-DD)',
            'Tgl Resign (YYYY-MM-DD)',
            'Jabatan',
            'Kebun',
            'Region (Riau/Kalbar/Kaltim)',
            'Jenis Resign (VOLUNTARY/INVOLUNTARY)',
            'Cluster Resign',
            'Alumni (Alumni/Non Alumni)',
            'Alasan Resign',
            'Keterangan',
        ];
    }

    public function array(): array
    {
        return [
            [
                '10001',
                'Ahmad Fauzi',
                '2021-02-15',
                '2026-03-31',
                'Asisten Kebun',
                'CPK',
                'Riau',
                'VOLUNTARY',
                'Pindah Perusahaan',
                'Alumni',
                'Mendapat tawaran kerja di perusahaan lain',
                'Asisten Afdeling 1',
            ],
            [
                '10002',
                'Budi Santoso',
                '2019-06-01',
                '2026-05-15',
                'Askep Kebun',
                'PSA',
                'Kalbar',
                'VOLUNTARY',
                'Keluarga',
                'Non Alumni',
                'Alasan keluarga di kampung halaman',
                'Staf Kebun',
            ],
            [
                '10003',
                'Cahyo Wibowo',
                '2022-10-10',
                '2026-06-30',
                'KTU Kebun',
                'SAGM',
                'Kaltim',
                'INVOLUNTARY',
                'Under Perform',
                'Alumni',
                'Evaluasi kinerja tahunan',
                '-',
            ],
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF004D40'],
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER,
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                ],
            ],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 14,
            'B' => 26,
            'C' => 24,
            'D' => 24,
            'E' => 22,
            'F' => 14,
            'G' => 26,
            'H' => 32,
            'I' => 24,
            'J' => 24,
            'K' => 38,
            'L' => 22,
        ];
    }
}
