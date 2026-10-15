<?php

namespace App\Services;

class InsightBuilder
{
    /**
     * Menghasilkan teks ringkasan (PRD 4.7)
     * "Mayoritas karyawan adalah generasi {gen_terbanyak} ({gen_pct}%) dan berada di usia produktif (rata-rata {avg_age} tahun). Risiko kehilangan pengetahuan cukup {tingkat_risiko} dengan {pensiun_count} karyawan ({pensiun_pct}%) yang akan pensiun dalam 5 tahun ke depan."
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

        $pensiunCount = $rawTotals['pensiun'];
        $pensiunPct = round(($pensiunCount / $totalHc) * 100, 1);

        $tingkatRisiko = $pensiunPct > 10 ? 'tinggi' : ($pensiunPct > 5 ? 'sedang' : 'rendah');

        return "Mayoritas karyawan adalah generasi {$topGen} ({$genPct}%) dan berada di usia produktif (rata-rata {$avgAge} tahun). Risiko kehilangan pengetahuan cukup {$tingkatRisiko} dengan {$pensiunCount} karyawan ({$pensiunPct}%) yang akan segera memasuki batas usia pensiun (55).";
    }
}
