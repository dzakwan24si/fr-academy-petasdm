<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class EmployeeTemplateExport implements FromArray, WithColumnWidths, WithHeadings, WithStyles
{
    public function headings(): array
    {
        return [
            'Employee ID',
            'Employee Name',
            'Join Date',
            'Employment Type',
            'Job Level Code',
            'Job Title Code',
            'Job Title Name',
            'Organization Code',
            'Organization Name',
            'Location Code',
            'Location Name',
            'Company Code',
            'Company Name',
            'Birth Date',
            'Birth Place',
            'Gender',
            'Marital Status',
            'Religion',
            'PTKP Code',
            'PTKP Name',
            'Group',
            'Region',
        ];
    }

    public function array(): array
    {
        return [
            [
                '10001',
                'Ahmad Fauzi',
                '2018-03-01',
                'PERMANENT',
                'C',
                'TC01',
                'Supervisor Lapangan',
                'ORG-OPS',
                'Estate Operations',
                'KR13',
                'SAM1',
                'R11',
                'PT. Subur Arum Makmur',
                '1988-06-15',
                'Pekanbaru',
                'Male',
                'Married',
                'Islam',
                'K1',
                'Kawin 1 Anak',
                'FR',
                'Riau',
            ],
            [
                '10002',
                'Budi Santoso',
                '2015-08-10',
                'PERMANENT',
                'D',
                'TC02',
                'Askep Kebun',
                'ORG-OPS',
                'Estate Operations',
                'KR07',
                'PISP1',
                'R09',
                'PT. Perdana Inti Sawit Perkasa',
                '1982-11-20',
                'Medan',
                'Male',
                'Married',
                'Islam',
                'K2',
                'Kawin 2 Anak',
                'FR',
                'Riau',
            ],
            [
                '10003',
                'Citra Lestari',
                '2012-05-22',
                'PERMANENT',
                'E',
                'TC03',
                'Manager Kebun',
                'ORG-MGT',
                'Estate Management',
                'PR02',
                'Pabrik CLP',
                'R03',
                'PT. Ciliandra Perkasa',
                '1979-04-05',
                'Jakarta',
                'Female',
                'Married',
                'Kristen',
                'K1',
                'Kawin 1 Anak',
                'FR',
                'Riau',
            ],
            [
                '10004',
                'Dedi Pratama',
                '2008-01-15',
                'PERMANENT',
                'F',
                'TC04',
                'Senior Manager / GM',
                'ORG-EXEC',
                'Regional Operations',
                'OF02-01',
                'Pekanbaru Office',
                'R01',
                'PT. Arindo Trisejahtera',
                '1972-09-12',
                'Padang',
                'Male',
                'Married',
                'Islam',
                'K3',
                'Kawin 3 Anak',
                'FR',
                'Riau',
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
            'D' => 16,
            'E' => 16,
            'F' => 16,
            'G' => 26,
            'H' => 18,
            'I' => 24,
            'J' => 16,
            'K' => 20,
            'L' => 16,
            'M' => 30,
            'N' => 14,
            'O' => 18,
            'P' => 12,
            'Q' => 14,
            'R' => 14,
            'S' => 12,
            'T' => 16,
            'U' => 14,
            'V' => 16,
        ];
    }
}
