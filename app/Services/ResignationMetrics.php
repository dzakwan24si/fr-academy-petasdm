<?php

namespace App\Services;

use App\Models\StaffResign;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class ResignationMetrics
{
    /**
     * Compute comprehensive metrics for Resignation Dashboard.
     */
    public function getMetrics(Request $request): array
    {
        $selectedYear = $request->input('year', 'all');
        $rawRegion = $request->input('region', 'all');

        $selectedRegions = [];
        if ($rawRegion !== 'all' && ! empty($rawRegion)) {
            $selectedRegions = collect(Arr::flatten((array) $rawRegion))
                ->filter(fn ($r) => ! empty($r) && $r !== 'all')
                ->values()
                ->all();
        }

        // Dynamically discover available years from the database
        $availableYears = StaffResign::query()
            ->whereNotNull('resign_date')
            ->selectRaw('DISTINCT YEAR(resign_date) as yr')
            ->orderByDesc('yr')
            ->pluck('yr')
            ->map(fn ($y) => (int) $y)
            ->values()
            ->toArray();

        if (empty($availableYears)) {
            $availableYears = [(int) date('Y'), (int) date('Y') - 1];
        }

        // Target (Current) Year & Comparison (Previous) Year
        if ($selectedYear !== 'all' && ! empty($selectedYear)) {
            $targetYear = (int) $selectedYear;
        } else {
            // Default to the latest year in DB
            $targetYear = $availableYears[0];
        }
        $compareYear = $targetYear - 1;

        // Base query for current filter (scoped by region)
        $baseQuery = StaffResign::query();
        if (! empty($selectedRegions)) {
            $baseQuery->whereIn('region', $selectedRegions);
        }

        // Clone base queries for comparison year and target year
        $qPrev = (clone $baseQuery)->whereYear('resign_date', $compareYear);
        $qCurr = (clone $baseQuery)->whereYear('resign_date', $targetYear);

        // 1. KPI Cards Calculations
        $totalPrev = (clone $qPrev)->count();
        $totalCurr = (clone $qCurr)->count();

        $vtPrev = (clone $qPrev)->where('jenis_resign', 'VOLUNTARY')->count();
        $vtCurr = (clone $qCurr)->where('jenis_resign', 'VOLUNTARY')->count();

        $itPrev = (clone $qPrev)->where('jenis_resign', 'INVOLUNTARY')->count();
        $itCurr = (clone $qCurr)->where('jenis_resign', 'INVOLUNTARY')->count();

        $alumniPrev = (clone $qPrev)->where('alumni', 'Alumni')->count();
        $alumniCurr = (clone $qCurr)->where('alumni', 'Alumni')->count();

        $nonAlumniPrev = (clone $qPrev)->where('alumni', 'Non Alumni')->count();
        $nonAlumniCurr = (clone $qCurr)->where('alumni', 'Non Alumni')->count();

        $kpis = [
            'total' => [
                'count_prev' => $totalPrev,
                'count_curr' => $totalCurr,
                'count_2025' => $totalPrev,
                'count_2026' => $totalCurr,
                'diff' => $totalCurr - $totalPrev,
                'diff_pct' => $totalPrev > 0 ? round((($totalCurr - $totalPrev) / $totalPrev) * 100, 1) : 0,
            ],
            'vt' => [
                'count_prev' => $vtPrev,
                'pct_prev' => $totalPrev > 0 ? round(($vtPrev / $totalPrev) * 100, 1) : 0,
                'count_curr' => $vtCurr,
                'pct_curr' => $totalCurr > 0 ? round(($vtCurr / $totalCurr) * 100, 1) : 0,
                'count_2025' => $vtPrev,
                'pct_2025' => $totalPrev > 0 ? round(($vtPrev / $totalPrev) * 100, 1) : 0,
                'count_2026' => $vtCurr,
                'pct_2026' => $totalCurr > 0 ? round(($vtCurr / $totalCurr) * 100, 1) : 0,
                'diff' => $vtCurr - $vtPrev,
                'diff_pct' => $vtPrev > 0 ? round((($vtCurr - $vtPrev) / $vtPrev) * 100, 1) : 0,
            ],
            'it' => [
                'count_prev' => $itPrev,
                'pct_prev' => $totalPrev > 0 ? round(($itPrev / $totalPrev) * 100, 1) : 0,
                'count_curr' => $itCurr,
                'pct_curr' => $totalCurr > 0 ? round(($itCurr / $totalCurr) * 100, 1) : 0,
                'count_2025' => $itPrev,
                'pct_2025' => $totalPrev > 0 ? round(($itPrev / $totalPrev) * 100, 1) : 0,
                'count_2026' => $itCurr,
                'pct_2026' => $totalCurr > 0 ? round(($itCurr / $totalCurr) * 100, 1) : 0,
                'diff' => $itCurr - $itPrev,
                'diff_pct' => $itPrev > 0 ? round((($itCurr - $itPrev) / $itPrev) * 100, 1) : 0,
            ],
            'alumni' => [
                'count_prev' => $alumniPrev,
                'pct_prev' => $totalPrev > 0 ? round(($alumniPrev / $totalPrev) * 100, 1) : 0,
                'count_curr' => $alumniCurr,
                'pct_curr' => $totalCurr > 0 ? round(($alumniCurr / $totalCurr) * 100, 1) : 0,
                'count_2025' => $alumniPrev,
                'pct_2025' => $totalPrev > 0 ? round(($alumniPrev / $totalPrev) * 100, 1) : 0,
                'count_2026' => $alumniCurr,
                'pct_2026' => $totalCurr > 0 ? round(($alumniCurr / $totalCurr) * 100, 1) : 0,
                'diff' => $alumniCurr - $alumniPrev,
                'diff_pct' => $alumniPrev > 0 ? round((($alumniCurr - $alumniPrev) / $alumniPrev) * 100, 1) : 0,
            ],
            'non_alumni' => [
                'count_prev' => $nonAlumniPrev,
                'pct_prev' => $totalPrev > 0 ? round(($nonAlumniPrev / $totalPrev) * 100, 1) : 0,
                'count_curr' => $nonAlumniCurr,
                'pct_curr' => $totalCurr > 0 ? round(($nonAlumniCurr / $totalCurr) * 100, 1) : 0,
                'count_2025' => $nonAlumniPrev,
                'pct_2025' => $totalPrev > 0 ? round(($nonAlumniPrev / $totalPrev) * 100, 1) : 0,
                'count_2026' => $nonAlumniCurr,
                'pct_2026' => $totalCurr > 0 ? round(($nonAlumniCurr / $totalCurr) * 100, 1) : 0,
                'diff' => $nonAlumniCurr - $nonAlumniPrev,
                'diff_pct' => $nonAlumniPrev > 0 ? round((($nonAlumniCurr - $nonAlumniPrev) / $nonAlumniPrev) * 100, 1) : 0,
            ],
        ];

        // 2. Cluster Penyebab Resign (Comparison prev vs curr)
        $clusters = (clone $baseQuery)
            ->select('cluster_resign')
            ->distinct()
            ->pluck('cluster_resign')
            ->filter()
            ->values();

        $clusterData = [];
        foreach ($clusters as $cl) {
            $cP = (clone $qPrev)->where('cluster_resign', $cl)->count();
            $cC = (clone $qCurr)->where('cluster_resign', $cl)->count();
            $vt = (clone $baseQuery)->where('cluster_resign', $cl)->where('jenis_resign', 'VOLUNTARY')->count();
            $it = (clone $baseQuery)->where('cluster_resign', $cl)->where('jenis_resign', 'INVOLUNTARY')->count();

            $clusterData[] = [
                'cluster' => $cl,
                'y_prev' => $cP,
                'y_curr' => $cC,
                'y2025' => $cP,
                'y2026' => $cC,
                'total' => $cP + $cC,
                'pct_prev' => $totalPrev > 0 ? round(($cP / $totalPrev) * 100, 1) : 0,
                'pct_curr' => $totalCurr > 0 ? round(($cC / $totalCurr) * 100, 1) : 0,
                'pct_2025' => $totalPrev > 0 ? round(($cP / $totalPrev) * 100, 1) : 0,
                'pct_2026' => $totalCurr > 0 ? round(($cC / $totalCurr) * 100, 1) : 0,
                'vt' => $vt,
                'it' => $it,
                'diff' => $cC - $cP,
                'diff_pct' => $cP > 0 ? round((($cC - $cP) / $cP) * 100, 1) : 0,
            ];
        }

        // Sort clusters by total descending
        usort($clusterData, fn ($a, $b) => $b['total'] <=> $a['total']);

        // 3. Cluster Resign by Jabatan (Comparison prev vs curr)
        $jabatans = (clone $baseQuery)
            ->select('jabatan')
            ->distinct()
            ->pluck('jabatan')
            ->filter()
            ->values();

        $jabatanData = [];
        foreach ($jabatans as $jb) {
            $jP = (clone $qPrev)->where('jabatan', $jb)->count();
            $jC = (clone $qCurr)->where('jabatan', $jb)->count();

            $jabatanData[] = [
                'jabatan' => $jb,
                'y_prev' => $jP,
                'y_curr' => $jC,
                'y2025' => $jP,
                'y2026' => $jC,
                'total' => $jP + $jC,
            ];
        }

        usort($jabatanData, fn ($a, $b) => $b['total'] <=> $a['total']);

        // 4. Sebaran Top 10 Per Kebun
        $topKebunPrev = (clone $qPrev)
            ->select('kebun', DB::raw('count(*) as total'), DB::raw("SUM(CASE WHEN jenis_resign = 'VOLUNTARY' THEN 1 ELSE 0 END) as vt"), DB::raw("SUM(CASE WHEN jenis_resign = 'INVOLUNTARY' THEN 1 ELSE 0 END) as it"))
            ->groupBy('kebun')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'kebun' => $row->kebun,
                'total' => (int) $row->total,
                'vt' => (int) $row->vt,
                'it' => (int) $row->it,
            ])
            ->toArray();

        $topKebunCurr = (clone $qCurr)
            ->select('kebun', DB::raw('count(*) as total'), DB::raw("SUM(CASE WHEN jenis_resign = 'VOLUNTARY' THEN 1 ELSE 0 END) as vt"), DB::raw("SUM(CASE WHEN jenis_resign = 'INVOLUNTARY' THEN 1 ELSE 0 END) as it"))
            ->groupBy('kebun')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'kebun' => $row->kebun,
                'total' => (int) $row->total,
                'vt' => (int) $row->vt,
                'it' => (int) $row->it,
            ])
            ->toArray();

        // 5. Monthly Turnover Trend
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        $monthlyTrend = [];

        $monthlyP = (clone $qPrev)
            ->select(DB::raw('MONTH(resign_date) as m'), DB::raw('count(*) as total'), DB::raw("SUM(CASE WHEN jenis_resign = 'VOLUNTARY' THEN 1 ELSE 0 END) as vt"), DB::raw("SUM(CASE WHEN jenis_resign = 'INVOLUNTARY' THEN 1 ELSE 0 END) as it"))
            ->groupBy('m')
            ->get()
            ->keyBy('m');

        $monthlyC = (clone $qCurr)
            ->select(DB::raw('MONTH(resign_date) as m'), DB::raw('count(*) as total'), DB::raw("SUM(CASE WHEN jenis_resign = 'VOLUNTARY' THEN 1 ELSE 0 END) as vt"), DB::raw("SUM(CASE WHEN jenis_resign = 'INVOLUNTARY' THEN 1 ELSE 0 END) as it"))
            ->groupBy('m')
            ->get()
            ->keyBy('m');

        for ($m = 1; $m <= 12; $m++) {
            $mPrev = $monthlyP->get($m);
            $mCurr = $monthlyC->get($m);

            $monthlyTrend[] = [
                'month' => $months[$m - 1],
                'month_num' => $m,
                'total_prev' => $mPrev ? (int) $mPrev->total : 0,
                'vt_prev' => $mPrev ? (int) $mPrev->vt : 0,
                'it_prev' => $mPrev ? (int) $mPrev->it : 0,
                'total_curr' => $mCurr ? (int) $mCurr->total : 0,
                'vt_curr' => $mCurr ? (int) $mCurr->vt : 0,
                'it_curr' => $mCurr ? (int) $mCurr->it : 0,
                'total_2025' => $mPrev ? (int) $mPrev->total : 0,
                'vt_2025' => $mPrev ? (int) $mPrev->vt : 0,
                'it_2025' => $mPrev ? (int) $mPrev->it : 0,
                'total_2026' => $mCurr ? (int) $mCurr->total : 0,
                'vt_2026' => $mCurr ? (int) $mCurr->vt : 0,
                'it_2026' => $mCurr ? (int) $mCurr->it : 0,
            ];
        }

        // 6. Regional Breakdown for summary
        $regionalBreakdown = StaffResign::query()
            ->select('region',
                DB::raw('count(*) as total'),
                DB::raw("SUM(CASE WHEN YEAR(resign_date) = {$compareYear} THEN 1 ELSE 0 END) as c_prev"),
                DB::raw("SUM(CASE WHEN YEAR(resign_date) = {$targetYear} THEN 1 ELSE 0 END) as c_curr"),
                DB::raw("SUM(CASE WHEN YEAR(resign_date) = {$compareYear} THEN 1 ELSE 0 END) as c2025"),
                DB::raw("SUM(CASE WHEN YEAR(resign_date) = {$targetYear} THEN 1 ELSE 0 END) as c2026")
            )
            ->groupBy('region')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => [
                'region' => $r->region,
                'total' => (int) $r->total,
                'c_prev' => (int) $r->c_prev,
                'c_curr' => (int) $r->c_curr,
                'c2025' => (int) $r->c2025,
                'c2026' => (int) $r->c2026,
            ])
            ->toArray();

        // 7. Executive Insights Generator
        $insights = $this->generateExecutiveInsights(
            $kpis,
            $clusterData,
            $jabatanData,
            $topKebunCurr,
            $regionalBreakdown,
            $selectedRegions,
            $targetYear,
            $compareYear
        );

        return [
            'year_current' => $targetYear,
            'year_previous' => $compareYear,
            'year_target' => $targetYear,
            'year_compare' => $compareYear,
            'kpis' => $kpis,
            'cluster_data' => $clusterData,
            'jabatan_data' => $jabatanData,
            'top_kebun_prev' => $topKebunPrev,
            'top_kebun_curr' => $topKebunCurr,
            'top_kebun_2025' => $topKebunPrev,
            'top_kebun_2026' => $topKebunCurr,
            'monthly_trend' => $monthlyTrend,
            'regional_breakdown' => $regionalBreakdown,
            'insights' => $insights,
            'available_years' => $availableYears,
            'available_regions' => ['Riau', 'Kalbar', 'Kaltim'],
        ];
    }

    /**
     * Compute concise resignation summary for Executive Dashboard.
     */
    public function getSummary(Request $request, int $totalHc = 0): array
    {
        $metrics = $this->getMetrics($request);
        $kpis = $metrics['kpis'] ?? [];
        $yearCurrent = $metrics['year_current'] ?? (int) date('Y');
        $yearPrevious = $metrics['year_previous'] ?? ($yearCurrent - 1);

        $totalCurr = $kpis['total']['count_curr'] ?? 0;
        $totalPrev = $kpis['total']['count_prev'] ?? 0;
        $diff = $kpis['total']['diff'] ?? ($totalCurr - $totalPrev);
        $diffPct = $kpis['total']['diff_pct'] ?? 0;

        $vtCurr = $kpis['vt']['count_curr'] ?? 0;
        $vtPct = $kpis['vt']['pct_curr'] ?? 0;
        $itCurr = $kpis['it']['count_curr'] ?? 0;
        $itPct = $kpis['it']['pct_curr'] ?? 0;

        $topCluster = ! empty($metrics['cluster_data']) ? $metrics['cluster_data'][0]['cluster'] : null;
        $topKebun = ! empty($metrics['top_kebun_curr']) ? $metrics['top_kebun_curr'][0]['kebun'] : null;

        $turnoverRate = $totalHc > 0 ? round(($totalCurr / $totalHc) * 100, 1) : null;

        return [
            'year_current' => $yearCurrent,
            'year_previous' => $yearPrevious,
            'total_curr' => $totalCurr,
            'total_prev' => $totalPrev,
            'diff' => $diff,
            'diff_pct' => $diffPct,
            'vt_curr' => $vtCurr,
            'vt_pct' => $vtPct,
            'it_curr' => $itCurr,
            'it_pct' => $itPct,
            'turnover_rate' => $turnoverRate,
            'top_cluster' => $topCluster,
            'top_kebun' => $topKebun,
            'insights' => array_slice($metrics['insights'] ?? [], 0, 2),
        ];
    }

    /**
     * Generate dynamic AI/Management bullet points based on resignation metrics.
     */
    private function generateExecutiveInsights(
        array $kpis,
        array $clusterData,
        array $jabatanData,
        array $topKebunCurr,
        array $regionalBreakdown,
        array $selectedRegions,
        int $targetYear,
        int $compareYear
    ): array {
        $bullets = [];

        if (! empty($selectedRegions)) {
            $regionNames = implode(', ', $selectedRegions);
            $bullets[] = "Data pergerakan turnover & resign difilter untuk region: {$regionNames}.";
        }

        // Total YoY insight
        $diffTotal = $kpis['total']['diff'];
        $diffPct = abs($kpis['total']['diff_pct']);
        $trendWord = $diffTotal <= 0 ? 'mengalami penurunan' : 'mengalami peningkatan';
        $bullets[] = "Total staff resign pada tahun {$targetYear} {$trendWord} sebesar {$diffPct}% dibandingkan tahun {$compareYear} (dari {$kpis['total']['count_prev']} menjadi {$kpis['total']['count_curr']} karyawan).";

        // Voluntary dominance
        $vtPctCurr = $kpis['vt']['pct_curr'];
        $itPctCurr = $kpis['it']['pct_curr'];
        $bullets[] = "Pengunduran diri sukarela (Voluntary) mendominasi pada tahun {$targetYear} dengan proporsi {$vtPctCurr}% ({$kpis['vt']['count_curr']} orang), sementara Involuntary (PHK/Audit/Underperform) sebesar {$itPctCurr}% ({$kpis['it']['count_curr']} orang).";

        // Dominant Cluster
        if (! empty($clusterData)) {
            $topCluster = $clusterData[0];
            $secondCluster = $clusterData[1] ?? null;
            $msg = "Penyebab resign terbanyak adalah '{$topCluster['cluster']}' ({$topCluster['total']} total kasus)";
            if ($secondCluster) {
                $msg .= ", disusul oleh faktor '{$secondCluster['cluster']}' ({$secondCluster['total']} total kasus).";
            } else {
                $msg .= '.';
            }
            $bullets[] = $msg;
        }

        // Dominant Jabatan
        if (! empty($jabatanData)) {
            $topJabatan = $jabatanData[0];
            $bullets[] = "Posisi lini operasional paling rentan adalah '{$topJabatan['jabatan']}' dengan total akumulasi turnover {$topJabatan['total']} staf.";
        }

        // Top Kebun hotspot
        if (! empty($topKebunCurr)) {
            $topUnit = $topKebunCurr[0];
            $bullets[] = "Unit perkebunan dengan resign tertinggi di {$targetYear} adalah kebun {$topUnit['kebun']} ({$topUnit['total']} staf: {$topUnit['vt']} Voluntary, {$topUnit['it']} Involuntary).";
        }

        // Alumni vs Non Alumni observation
        $alumniPct = $kpis['alumni']['pct_curr'];
        $bullets[] = "Sebanyak {$alumniPct}% dari total resign {$targetYear} merupakan Alumni FRLC ({$kpis['alumni']['count_curr']} staf), menunjukkan urgensi evaluasi retention program serta jalur karir pasca program pelatihan.";

        return $bullets;
    }
}
