<?php

namespace App\Services\Import;

class ImportReport
{
    public int $totalRows = 0;
    public int $importedRows = 0;
    public int $skippedRows = 0;
    public array $warnings = [];

    public function addWarning(string $category, string $message, ?string $sample = null): void
    {
        if (!isset($this->warnings[$category])) {
            $this->warnings[$category] = ['message' => $message, 'count' => 0, 'samples' => []];
        }
        $this->warnings[$category]['count']++;
        if ($sample) {
            if (!mb_check_encoding($sample, 'UTF-8')) {
                $sample = mb_convert_encoding($sample, 'UTF-8', 'ISO-8859-1');
            }
            if (count($this->warnings[$category]['samples']) < 20) {
                $this->warnings[$category]['samples'][] = $sample;
            }
        }
    }

    public function toArray(): array
    {
        return [
            'total_rows' => $this->totalRows,
            'imported_rows' => $this->importedRows,
            'skipped_rows' => $this->skippedRows,
            'warnings' => $this->warnings,
        ];
    }
}
