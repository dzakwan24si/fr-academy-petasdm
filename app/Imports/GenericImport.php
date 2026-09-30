<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToArray;

class GenericImport implements ToArray
{
    public function array(array $array): void
    {
        // Handled by Excel::toArray() return value.
    }
}
