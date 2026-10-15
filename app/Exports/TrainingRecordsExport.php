<?php

namespace App\Exports;

use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Database\Query\Builder;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\DefaultValueBinder;

class TrainingRecordsExport extends DefaultValueBinder implements FromQuery, WithCustomValueBinder, WithHeadings, WithMapping
{
    use Exportable;

    protected $query;

    public function __construct($query)
    {
        $this->query = $query;
    }

    public function query(): Builder|\Illuminate\Database\Eloquent\Builder|Relation
    {
        return $this->query;
    }

    public function headings(): array
    {
        return [
            'ID Database',
            'NIK / Employee ID',
            'NIK Mentah',
            'Status NIK',
            'Nama Peserta',
            'Nama PT (Raw)',
            'Perusahaan Alias',
            'Departemen',
            'Lokasi Kerja',
            'Group',
            'Region',
            'Kategori Jabatan (Staf/Non Staf)',
            'Posisi Jabatan',
            'Periode Bulan',
            'Periode Tahun',
            'Hari',
            'Jam',
            'Nama Pelatihan',
            'Instruktur',
            'Tempat',
            'Reguler / Non Reguler',
            'Internal / Eksternal',
            'Level',
        ];
    }

    public function map($record): array
    {
        return [
            $record->id,
            $record->nik,
            $record->nik_raw,
            $record->nik_status,
            $record->participant_name,
            $record->company_name_raw,
            $record->company ? $record->company->name : null,
            $record->department,
            $record->work_location,
            $record->group,
            $record->region,
            $record->grade,
            $record->position,
            $record->month,
            $record->year,
            $record->days,
            $record->hours,
            $record->training_name,
            $record->instructor,
            $record->venue,
            $record->regularity,
            $record->source_type,
            $record->level,
        ];
    }

    public function bindValue(Cell $cell, mixed $value): bool
    {
        $column = $cell->getColumn();
        // Force these code columns to be explicit strings to prevent scientific notation (NIK & NIK Mentah)
        if (in_array($column, ['B', 'C'])) {
            $cell->setValueExplicit($value, DataType::TYPE_STRING);

            return true;
        }

        return parent::bindValue($cell, $value);
    }
}
