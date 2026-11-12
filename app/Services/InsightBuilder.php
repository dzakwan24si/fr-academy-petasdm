<?php

namespace App\Services;

class InsightBuilder
{
    /**
     * Menghasilkan teks ringkasan demografi karyawan.
     */
    public static function build(array $rawTotals, float $avgAge, int $totalHc): ?string
    {
        if ($totalHc === 0 || empty($rawTotals['generations'])) {
            return null;
        }

        $generations = $rawTotals['generations'];
        arsort($generations);
        $topGen = array_key_first($generations);
        $topGenCount = $generations[$topGen];
        $genPct = round(($topGenCount / $totalHc) * 100, 1);

        return "Mayoritas karyawan adalah generasi {$topGen} ({$genPct}%) dan berada di usia produktif (rata-rata {$avgAge} tahun).";
    }
}
