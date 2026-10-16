<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Concerns\WithCalculatedFormulas;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\DefaultValueBinder;

class GenericImport extends DefaultValueBinder implements ToArray, WithCalculatedFormulas, WithCustomValueBinder
{
    public function array(array $array): void
    {
        // Handled by Excel::toArray() return value.
    }

    public function bindValue(Cell $cell, mixed $value): bool
    {
        // Jika nilai aslinya string numerik panjang, paksa sebagai string agar tidak jadi float/notasi ilmiah
        if (is_string($value) && is_numeric($value) && strlen($value) >= 10 && ! str_contains($value, '.')) {
            $cell->setValueExplicit($value, DataType::TYPE_STRING);

            return true;
        }

        return parent::bindValue($cell, $value);
    }
}
