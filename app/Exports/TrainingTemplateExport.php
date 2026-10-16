<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class TrainingTemplateExport implements FromArray, WithColumnWidths, WithHeadings, WithStyles
{
    public function headings(): array
    {
        return [
            'NIK',
            'Nama',
            'Jenis Kelamin',
            'Nama PT',
            'Department',
            'lokasi Kerja',
            'Group',
            'REGION',
            'GOL',
            'Jabatan',
            'Tgl',
            'Bln',
            'Thn',
            'Jml Hari',
            'Jam Pelatihan',
            'Nama Pelatihan',
            'Instruktur',
            'Tempat Pelatihan',
            'Reg / Non Reg',
            'Keterangan',
            'Internal/Eksternal',
            'Level',
            'Periode',
        ];
    }

    public function array(): array
    {
        return [
            [
                '10001',
                'Ahmad Fauzi',
                'Male',
                'PT. Subur Arum Makmur',
                'Agronomy',
                'SAM1',
                'FR',
                'Riau',
                'Staf',
                'Supervisor Lapangan',
                15,
                'JAN',
                2024,
                2,
                16,
                'Pelatihan K3 Operasional Kebun',
                'Internal Trainer',
                'Training Center Riau',
                'Reguler',
                'Selesai',
                'Internal',
                'Workers',
                'Q1',
            ],
            [
                '10002',
                'Budi Santoso',
                'Male',
                'PT. Perdana Inti Sawit Perkasa',
                'Engineering',
                'PISP1',
                'FR',
                'Riau',
                'Staf',
                'Askep Kebun',
                20,
                'FEB',
                2024,
                3,
                24,
                'Supervisory & Leadership Development',
                'Lembaga Manajemen',
                'Pekanbaru Hotel',
                'Reguler',
                'Selesai',
                'Eksternal',
                'Middle',
                'Q1',
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
            'A' => 16,
            'B' => 24,
            'C' => 14,
            'D' => 30,
            'E' => 18,
            'F' => 16,
            'G' => 12,
            'H' => 14,
            'I' => 12,
            'J' => 24,
            'K' => 8,
            'L' => 8,
            'M' => 8,
            'N' => 10,
            'O' => 14,
            'P' => 34,
            'Q' => 20,
            'R' => 24,
            'S' => 14,
            'T' => 16,
            'U' => 18,
            'V' => 14,
            'W' => 10,
        ];
    }
}
