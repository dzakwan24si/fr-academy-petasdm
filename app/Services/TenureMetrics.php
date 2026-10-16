<?php

namespace App\Services;

use App\Models\Employee;
use App\Support\EmployeeFilter;
use Carbon\Carbon;
use Illuminate\Http\Request;

class TenureMetrics
{
    public function getMetrics(Request $request, EmployeeFilter $filter)
    {
        $query = Employee::query();
        $query = $filter->apply($query, $request);

        $employees = $query->get([
            'birth_date', 'join_date', 'region', 'job_level_code', 'employment_type', 'gender',
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
            if (! $e->join_date || ! $e->birth_date) {
                continue;
            }

            $join = Carbon::parse($e->join_date);
            $birth = Carbon::parse($e->birth_date);

            $ageFloat = $birth->diffInMonths($asOf) / 12;
            $tenureFloat = $join->diffInMonths($asOf) / 12;

            if ($tenureFloat < 1) {
                $histogram['<1 tahun']++;
            } elseif ($tenureFloat < 3) {
                $histogram['1-<3 tahun']++;
            } elseif ($tenureFloat < 5) {
                $histogram['3-<5 tahun']++;
            } elseif ($tenureFloat < 10) {
                $histogram['5-<10 tahun']++;
            } else {
                $histogram['10+ tahun']++;
            }

            $jYear = $join->year;
            $joinYearly[$jYear] = ($joinYearly[$jYear] ?? 0) + 1;

            if ($jYear >= $yearLimit && $jYear <= $asOf->year) {
                $my = $join->format('Y-m');
                $joinMonthly[$my] = ($joinMonthly[$my] ?? 0) + 1;
            }

            $lvl = $e->job_level_code ?? 'Unknown';
            if (! isset($tenureByLevelSum[$lvl])) {
                $tenureByLevelSum[$lvl] = ['sum' => 0, 'count' => 0];
            }
            $tenureByLevelSum[$lvl]['sum'] += $tenureFloat;
            $tenureByLevelSum[$lvl]['count']++;

            $reg = $e->region ?? 'Unknown';
            if (! isset($tenureByRegionSum[$reg])) {
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
                'join_age' => round($joinAge, 1),
            ];

            if (! isset($heatmap[$jYear])) {
                $heatmap[$jYear] = [];
            }
            $heatmap[$jYear][$reg] = ($heatmap[$jYear][$reg] ?? 0) + 1;

            if (! isset($waves[$jYear])) {
                $waves[$jYear] = [
                    'total' => 0,
                    'types' => [],
                    'levels' => [],
                    'regions' => [],
                    'genders' => [],
                    'join_ages_sum' => 0,
                    'tenures_sum' => 0,
                ];
            }
            $waves[$jYear]['total']++;
            $etype = $e->employment_type ?? 'Unknown';
            $waves[$jYear]['types'][$etype] = ($waves[$jYear]['types'][$etype] ?? 0) + 1;

            $lvl = $e->job_level_code ?? '-';
            $waves[$jYear]['levels'][$lvl] = ($waves[$jYear]['levels'][$lvl] ?? 0) + 1;

            $regVal = $e->region ?? 'Unknown';
            $waves[$jYear]['regions'][$regVal] = ($waves[$jYear]['regions'][$regVal] ?? 0) + 1;

            $genVal = $e->gender ?? 'Unknown';
            $waves[$jYear]['genders'][$genVal] = ($waves[$jYear]['genders'][$genVal] ?? 0) + 1;

            $waves[$jYear]['join_ages_sum'] += $joinAge;
            $waves[$jYear]['tenures_sum'] += $tenureFloat;
        }

        ksort($joinYearly);
        ksort($joinMonthly);

        $levelOrder = ['A', 'B', 'C', 'D', 'E', 'F', '1', '2', '3', '4', '5'];
        $avgByLevel = [];
        foreach ($levelOrder as $lvl) {
            if (isset($tenureByLevelSum[$lvl])) {
                $avgByLevel[$lvl] = round($tenureByLevelSum[$lvl]['sum'] / $tenureByLevelSum[$lvl]['count'], 1);
            }
        }
        foreach ($tenureByLevelSum as $lvl => $data) {
            if (! in_array($lvl, $levelOrder)) {
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
            ksort($data['levels']);
            arsort($data['regions']);
            arsort($data['genders']);
            $dominant = array_key_first($data['types']) ?? 'PERMANENT';
            $count = max($data['total'], 1);

            $recruitmentWaves[] = [
                'year' => (string) $year,
                'total' => $data['total'],
                'dominant_type' => $dominant,
                'types' => $data['types'],
                'levels' => $data['levels'],
                'regions' => $data['regions'],
                'genders' => $data['genders'],
                'avg_join_age' => round($data['join_ages_sum'] / $count, 1),
                'avg_tenure' => round($data['tenures_sum'] / $count, 1),
            ];
        }

        ksort($heatmap);

        return [
            'histogram' => $histogram,
            'trend' => [
                'yearly' => $joinYearly,
                'monthly' => $joinMonthly,
            ],
            'average' => [
                'level' => $avgByLevel,
                'region' => $avgByRegion,
            ],
            'scatter' => $scatter,
            'heatmap' => $heatmap,
            'waves' => $recruitmentWaves,
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
            'waves' => [],
        ];
    }
}
