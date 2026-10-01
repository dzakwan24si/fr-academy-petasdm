<?php

namespace App\Support;

use Carbon\Carbon;

/**
 * Aturan pembersihan data berdasarkan hasil profiling CSV asli.
 */
class Clean
{
    /** "04-Dec-06" -> Carbon. Tahun 2 digit: yy <= $pivot => 20yy, selain itu 19yy. */
    public static function date2(?string $value, int $pivot): ?Carbon
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }

        if (is_numeric($value)) {
            try {
                return Carbon::instance(\PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value))->startOfDay();
            } catch (\Throwable) {
                return null;
            }
        }

        if (! preg_match('/^(\d{1,2})-([A-Za-z]{3})-(\d{2}|\d{4})$/', $value, $m)) {
            return null;
        }

        $year = (int) $m[3];
        if (strlen($m[3]) === 2) {
            $year += $year <= $pivot ? 2000 : 1900;
        }

        try {
            return Carbon::createFromFormat('d-M-Y', "{$m[1]}-{$m[2]}-{$year}")->startOfDay();
        } catch (\Throwable) {
            return null;
        }
    }

    /** Karyawan termuda di data lahir 2006, jadi pivot 15 aman untuk tanggal lahir. */
    public static function birth(?string $v): ?Carbon
    {
        return self::date2($v, 15);
    }

    /** Join date: pivot = tahun berjalan (2 digit) supaya tidak jatuh ke masa depan. */
    public static function join(?string $v): ?Carbon
    {
        return self::date2($v, (int) now()->format('y'));
    }

    public static function month(?string $v): ?int
    {
        static $map = [
            'JAN' => 1, 'FEB' => 2, 'MAR' => 3, 'APR' => 4, 'MAY' => 5, 'MEI' => 5,
            'JUN' => 6, 'JUL' => 7, 'AUG' => 8, 'AGT' => 8, 'AGU' => 8, 'AGS' => 8, 'SEP' => 9,
            'OCT' => 10, 'OKT' => 10, 'NOV' => 11, 'DEC' => 12, 'DES' => 12,
        ];

        return $map[strtoupper(substr(trim((string) $v), 0, 3))] ?? null;
    }

    public static function region(?string $v): ?string
    {
        $k = strtolower(trim((string) $v));
        if ($k === '') return null;
        if ($k === 'kaltim') return 'Kaltim';
        return ucfirst($k);
    }

    public static function regularity(?string $v): ?string
    {
        $k = strtolower(trim((string) $v));
        if ($k === '') {
            return null;
        }

        return str_contains($k, 'non') ? 'Non Reguler' : 'Reguler';
    }

    public static function level(?string $v): ?string
    {
        $k = strtolower(trim((string) $v));

        return $k === '' ? null : ucfirst($k);
    }

    /**
     * Status NIK dari sumber training:
     *  - empty   : kosong atau "-"
     *  - corrupt : rusak notasi ilmiah Excel, mis. "2,01407E+13"
     *  - invalid : bukan angka murni, mis. "Promosi"
     *  - ok      : angka murni
     */
    public static function nikStatus(?string $v): string
    {
        $v = trim((string) $v);

        return match (true) {
            $v === '' || $v === '-' => 'empty',
            (bool) preg_match('/^\d+[,.]?\d*E\+\d+$/i', $v) => 'corrupt',
            ! ctype_digit($v) => 'invalid',
            default => 'ok',
        };
    }

    /** NIK yang bisa dipakai (status ok), selain itu null. */
    public static function nik(?string $v): ?string
    {
        return self::nikStatus($v) === 'ok' ? trim((string) $v) : null;
    }

    /** "PT. Panca Surya Garden" dan "PANCA SURYA GARDEN" => "PANCA SURYA GARDEN" */
    public static function companyKey(?string $v): string
    {
        $v = strtoupper(trim((string) $v));
        $v = preg_replace('/^(PT\.?|CV\.?)\s+/', '', $v);
        $v = preg_replace('/[^A-Z0-9 ]/', ' ', $v);

        return trim(preg_replace('/\s+/', ' ', $v));
    }
}
