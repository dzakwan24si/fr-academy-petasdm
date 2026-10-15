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

class EmployeesExport extends DefaultValueBinder implements FromQuery, WithCustomValueBinder, WithHeadings, WithMapping
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
            'Employee ID / NIK',
            'Nama',
            'Tanggal Lahir',
            'Tempat Lahir',
            'Tanggal Bergabung',
            'Tipe Pekerjaan',
            'Kode Level Jabatan',
            'Kode Jabatan',
            'Nama Jabatan',
            'Kode Organisasi',
            'Nama Organisasi',
            'Perusahaan',
            'Lokasi',
            'Gender',
            'Status Pernikahan',
            'Agama',
            'Kode PTKP',
            'Nama PTKP',
            'Group',
            'Region',
        ];
    }

    public function map($employee): array
    {
        return [
            $employee->id,
            $employee->employee_id,
            $employee->name,
            $employee->birth_date,
            $employee->birth_place,
            $employee->join_date,
            $employee->employment_type,
            $employee->job_level_code,
            $employee->job_title_code,
            $employee->job_title_name,
            $employee->organization_code,
            $employee->organization_name,
            $employee->company ? $employee->company->name : null,
            $employee->location ? $employee->location->name : null,
            $employee->gender,
            $employee->marital_status,
            $employee->religion,
            $employee->ptkp_code,
            $employee->ptkp_name,
            $employee->group,
            $employee->region,
        ];
    }

    public function bindValue(Cell $cell, mixed $value): bool
    {
        $column = $cell->getColumn();
        // Force these code columns to be explicit strings to prevent scientific notation
        if (in_array($column, ['B', 'H', 'I', 'K', 'R'])) {
            $cell->setValueExplicit($value, DataType::TYPE_STRING);

            return true;
        }

        return parent::bindValue($cell, $value);
    }
}
