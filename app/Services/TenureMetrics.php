<?php

namespace App\Services;

use Illuminate\Http\Request;
use App\Support\EmployeeFilter;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TenureMetrics
{
    public function getMetrics(Request $request, EmployeeFilter $filter)
    {
        $query = \App\Models\Employee::query();
        $query = $filter->apply($query, $request);

        $employees = $query->get([
            'birth_date', 'join_date', 'region', 'job_level_code', 'employment_type'
        ]);

        if ($employees->isEmpty()) {
            return $this->emptyMetrics();
        }

        $asOf = $request->input('as_of') ? Carbon::parse($request->input('as_of')) : Carbon::today();

        $histogram = [
            '<1 tahun' => 0,
            '1-<3 tahun' => 0,
            '3-<5 tahun' => 0,
            '5-<10 tahun' => 0,
            '10+ tahun' => 0,
        ];

        $joinYearly = [];
        $joinMonthly = []; // Only for last 3 years
        $yearLimit = $asOf->year - 3;

        $tenureByLevelSum = [];
        $tenureByRegionSum = [];
        
        $scatter = [];
        $heatmap = [];
        
        $waves = [];

        foreach ($employees as $e) {
            if (!$e->join_date || !$e->birth_date) continue;

            $join = Carbon::parse($e->join_date);
            $birth = Carbon::parse($e->birth_date);
            
            $ageFloat = $birth->diffInMonths($asOf) / 12;
            $tenureFloat = $join->diffInMonths($asOf) / 12;

            if ($tenureFloat < 1) $histogram['<1 tahun']++;
            elseif ($tenureFloat < 3) $histogram['1-<3 tahun']++;
            elseif ($tenureFloat < 5) $histogram['3-<5 tahun']++;
            elseif ($tenureFloat < 10) $histogram['5-<10 tahun']++;
            else $histogram['10+ tahun']++;

            $jYear = $join->year;
            $joinYearly[$jYear] = ($joinYearly[$jYear] ?? 0) + 1;
            
            if ($jYear >= $yearLimit && $jYear <= $asOf->year) {
                $my = $join->format('Y-m');
                $joinMonthly[$my] = ($joinMonthly[$my] ?? 0) + 1;
            }

            $lvl = $e->job_level_code ?? 'Unknown';
            if (!isset($tenureByLevelSum[$lvl])) {
                $tenureByLevelSum[$lvl] = ['sum' => 0, 'count' => 0];
            }
            $tenureByLevelSum[$lvl]['sum'] += $tenureFloat;
            $tenureByLevelSum[$lvl]['count']++;

            $reg = $e->region ?? 'Unknown';
            if (!isset($tenureByRegionSum[$reg])) {
                $tenureByRegionSum[$reg] = ['sum' => 0, 'count' => 0];
            }
            $tenureByRegionSum[$reg]['sum'] += $tenureFloat;
            $tenureByRegionSum[$reg]['count']++;

            $joinAge = $birth->diffInMonths($join) / 12;
            $isAnomaly = ($joinAge < 18 || $joinAge > 55) ? 'yes' : 'no';
            
            $scatter[] = [
                'umur' => round($ageFloat, 1),
                'masa_kerja' => round($tenureFloat, 1),
                'anomali' => $isAnomaly,
                'join_age' => round($joinAge, 1)
            ];

            if (!isset($heatmap[$jYear])) {
                $heatmap[$jYear] = [];
            }
            $heatmap[$jYear][$reg] = ($heatmap[$jYear][$reg] ?? 0) + 1;

            if (!isset($waves[$jYear])) {
                $waves[$jYear] = ['total' => 0, 'types' => []];
            }
            $waves[$jYear]['total']++;
            $etype = $e->employment_type ?? 'Unknown';
            $waves[$jYear]['types'][$etype] = ($waves[$jYear]['types'][$etype] ?? 0) + 1;
        }

        ksort($joinYearly);
        ksort($joinMonthly);

        $levelOrder = ['A','B','C','D','E','F','1','2','3','4','5'];
        $avgByLevel = [];
        foreach ($levelOrder as $lvl) {
            if (isset($tenureByLevelSum[$lvl])) {
                $avgByLevel[$lvl] = round($tenureByLevelSum[$lvl]['sum'] / $tenureByLevelSum[$lvl]['count'], 1);
            }
        }
        foreach ($tenureByLevelSum as $lvl => $data) {
            if (!in_array($lvl, $levelOrder)) {
                $avgByLevel[$lvl] = round($data['sum'] / $data['count'], 1);
            }
        }

        $avgByRegion = [];
        foreach ($tenureByRegionSum as $reg => $data) {
            $avgByRegion[$reg] = round($data['sum'] / $data['count'], 1);
        }
        arsort($avgByRegion);

        krsort($waves);
        $recruitmentWaves = [];
        foreach ($waves as $year => $data) {
            arsort($data['types']);
            $dominant = array_key_first($data['types']);
            $recruitmentWaves[] = [
                'year' => (string) $year,
                'total' => $data['total'],
                'dominant_type' => $dominant
            ];
        }

        ksort($heatmap);
        
        return [
            'histogram' => $histogram,
            'trend' => [
                'yearly' => $joinYearly,
                'monthly' => $joinMonthly
            ],
            'average' => [
                'level' => $avgByLevel,
                'region' => $avgByRegion
            ],
            'scatter' => $scatter,
            'heatmap' => $heatmap,
            'waves' => array_slice($recruitmentWaves, 0, 15)
        ];
    }
    
    private function emptyMetrics()
    {
        return [
            'histogram' => [],
            'trend' => ['yearly' => [], 'monthly' => []],
            'average' => ['level' => [], 'region' => []],
            'scatter' => [],
            'heatmap' => [],
            'waves' => []
        ];
    }
}
