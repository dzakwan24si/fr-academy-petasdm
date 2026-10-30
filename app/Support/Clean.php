<?php

namespace App\Support;

use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Shared\Date;

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
                return Carbon::instance(Date::excelToDateTimeObject($value))->startOfDay();
            } catch (\Throwable) {
                return null;
            }
        }

        if (preg_match('/^(\d{1,2})-([A-Za-z]{3})-(\d{2}|\d{4})$/', $value, $m)) {
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

        try {
            return Carbon::parse($value)->startOfDay();
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
        if ($k === '') {
            return null;
        }
        if ($k === 'kaltim' || $k === 'kubar' || $k === 'kutai barat') {
            return 'Kaltim';
        }
        if ($k === 'kalbar' || $k === 'kalimantan barat') {
            return 'Kalbar';
        }
        if ($k === 'riau') {
            return 'Riau';
        }

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

    /**
     * Ekstrak inisial/akronim operasional dan daftar alias pencarian untuk perusahaan.
     *
     * @param  string  $name  Nama lengkap perusahaan (mis. "PT. Subur Arum Makmur 1")
     * @param  array<int, string>  $locationNames  Daftar nama unit operasional perusahaan
     * @return array{initials: string, aliases: array<int, string>}
     */
    public static function companyMeta(string $name, array $locationNames = []): array
    {
        // Kamus akronim operasional standar FR Group & unit perkebunan
        $dictionary = [
            'CILIANDRA PERKASA' => 'CLP',
            'ARINDO TRISEJAHTERA' => 'ATS',
            'PRIATAMA RIAU' => 'PTR',
            'ADHITYA SERAYAKORITA' => 'ASK',
            'SETIA AGRINDO MANDIRI' => 'SAGM',
            'PANCA SURYA GARDEN' => 'PSG',
            'PANCA SURYA AGRINDO' => 'PSA',
            'SUBUR ARUM MAKMUR' => 'SAM',
            'PERDANA INTI SAWIT PERKASA' => 'PISP',
            'SAHABAT MEWAH & MAKMUR' => 'SMM',
            'SAHABAT MEWAH DAN MAKMUR' => 'SMM',
            'MERIDAN SEJATI SURYA PLANTATION' => 'MSSP',
            'KARYA TAMA BAKTI MULIA' => 'KTBM',
            'KAYUNG AGRO LESTARI' => 'KALE',
            'KETAPANG AGRO LESTARI' => 'KAL',
            'FALCON AGRI PERSADA' => 'FAP',
            'AUSTINDO NUSANTARA JAYA AGRI SIAIS' => 'ANJAS',
            'AUSTINDO NUSANTARA JAYA AGRI' => 'ANJA',
            'AUSTINDO AUFWIND NEW ENERGY' => 'AANE',
        ];

        $clean = preg_replace('/^(PT\.?|CV\.?|YAYASAN)\s+/i', '', trim($name));

        // Deteksi penomoran entitas jika ada (mis. "Subur Arum Makmur 1" -> 1)
        $number = '';
        if (preg_match('/\b(\d+)\s*$/', $clean, $m)) {
            $number = $m[1];
            $baseName = trim((string) preg_replace('/\b\d+\s*$/', '', $clean));
        } else {
            $baseName = $clean;
        }

        $upperBase = strtoupper((string) preg_replace('/[^A-Za-z0-9& ]/', '', $baseName));
        $upperBase = trim((string) preg_replace('/\s+/', ' ', $upperBase));

        $primaryInitial = $dictionary[$upperBase] ?? null;

        // Jika tidak tercatat di kamus khusus, turunkan dari huruf depan setiap kata
        if (! $primaryInitial) {
            $splitCamel = (string) preg_replace('/([a-z])([A-Z])/', '$1 $2', $baseName);
            $cleanWords = (string) preg_replace('/\b(dan|and)\b/i', '', $splitCamel);
            $cleanWords = str_replace(['&', '.', ',', '(', ')', '-'], ' ', $cleanWords);
            $words = array_values(array_filter(explode(' ', $cleanWords)));

            $initials = '';
            foreach ($words as $w) {
                $w = trim($w);
                if ($w !== '') {
                    $initials .= strtoupper($w[0]);
                }
            }
            $primaryInitial = $initials;
        }

        // Susun variasi alias pencarian
        $aliases = [];
        if ($primaryInitial) {
            $aliases[] = $primaryInitial;
            if ($number !== '') {
                $aliases[] = $primaryInitial.$number;
                $aliases[] = $primaryInitial.' '.$number;
            }
        }

        // Pindai nama unit operasional untuk mendeteksi inisial lokal (mis. "Kebun SAM1", "Pabrik KALE", "Pabrik MKS2")
        $ignoredTokens = [
            'KEBUN', 'PABRIK', 'MILL', 'ESTATE', 'RO', 'OFFICE', 'DIVISI',
            'AFDELING', 'BIODIESEL', 'DOWNSTREAM', 'STATION', 'REFINERY',
            'CIKARANG', 'BULKING', 'CENTER', 'TRAINING', 'PEKANBARU', 'JAKARTA',
        ];
        foreach ($locationNames as $loc) {
            $parts = preg_split('/[\s,\-\/]+/', strtoupper((string) $loc));
            if (! is_array($parts)) {
                continue;
            }
            foreach ($parts as $p) {
                $p = trim($p);
                if (strlen($p) >= 2 && strlen($p) <= 6 && ! in_array($p, $ignoredTokens, true)) {
                    $aliases[] = $p;
                    if (preg_match('/^([A-Z]+)\d+$/', $p, $pm)) {
                        $aliases[] = $pm[1];
                    }
                }
            }
        }

        $aliases = array_values(array_unique(array_filter($aliases)));
        $badge = $primaryInitial.($number !== '' ? " {$number}" : '');

        return [
            'initials' => $badge,
            'aliases' => $aliases,
        ];
    }

    /**
     * Deteksi daftar tipe fasilitas operasional (Kebun, Pabrik, Downstream, Office)
     * berdasarkan nama unit kerja yang dimiliki perusahaan.
     *
     * @param  array<int, string>  $locationNames
     * @return array<int, string>
     */
    public static function facilities(array $locationNames): array
    {
        if (empty($locationNames)) {
            return [];
        }

        $hasKebun = false;
        $hasPabrik = false;
        $hasDownstream = false;
        $hasOffice = false;

        foreach ($locationNames as $loc) {
            $l = strtolower(trim((string) $loc));

            $isDownstream = (
                str_contains($l, 'biodiesel') ||
                str_contains($l, 'bulking') ||
                str_contains($l, 'downstream') ||
                str_contains($l, 'refinery') ||
                str_contains($l, 'kcp') ||
                str_contains($l, 'cikarang') ||
                str_contains($l, 'jetty')
            );

            $isPabrik = (
                str_contains($l, 'pabrik') ||
                str_contains($l, 'mill') ||
                str_contains($l, 'pks')
            );

            $isOffice = (
                str_contains($l, 'office') ||
                str_contains($l, 'jakarta') ||
                str_contains($l, 'pekanbaru') ||
                str_contains($l, 'pontianak') ||
                str_contains($l, 'balikpapan') ||
                str_contains($l, 'ro ') ||
                str_contains($l, 'head office')
            );

            if ($isDownstream) {
                $hasDownstream = true;
            }
            if ($isPabrik) {
                $hasPabrik = true;
            }
            if ($isOffice) {
                $hasOffice = true;
            }

            if (! $isDownstream && ! $isPabrik && ! $isOffice) {
                $hasKebun = true;
            }
        }

        $facilities = [];
        if ($hasKebun) {
            $facilities[] = 'Estate';
        }
        if ($hasPabrik) {
            $facilities[] = 'Mill';
        }
        if ($hasDownstream) {
            $facilities[] = 'Downstream';
        }
        if (empty($facilities) && $hasOffice) {
            $facilities[] = 'Office';
        }

        return $facilities;
    }
}
