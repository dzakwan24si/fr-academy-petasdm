<?php

namespace App\Services;

use App\Models\Employee;
use App\Support\Demographics;
use App\Support\EmployeeFilter;
use App\Support\MetricsHelper;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CombinedMetrics
{
    public function getMetrics(Request $request, EmployeeFilter $filter)
    {
        $asOf = $request->input('as_of') ? Carbon::parse($request->input('as_of')) : Carbon::now();

        $query = Employee::query();
        $query = $filter->apply($query, $request);

        $employees = $query->get([
            'id', 'employee_id', 'region', 'company_id', 'organization_name', 'job_level_code',
            'job_title_name', 'birth_date', 'join_date', 'gender',
        ]);

        $totalEmployees = $employees->count();
        if ($totalEmployees === 0) {
            return $this->emptyMetrics();
        }

        $empIds = $employees->pluck('id')->toArray();

        $trainings = DB::table('training_records')
            ->whereNotNull('employee_id')
            ->whereIn('employee_id', $empIds)
            ->get(['employee_id', 'hours']);

        $totalTrainingsAll = DB::table('training_records')->count();
        $unlinkedTrainingsAll = DB::table('training_records')->whereNull('employee_id')->count();
        $unlinkedPct = $totalTrainingsAll > 0 ? round(($unlinkedTrainingsAll / $totalTrainingsAll) * 100, 1) : 0;

        $banner = [
            'unlinked_count' => $unlinkedTrainingsAll,
            'total_count' => $totalTrainingsAll,
            'unlinked_pct' => $unlinkedPct,
        ];

        $empHours = [];
        foreach ($trainings as $t) {
            if (! isset($empHours[$t->employee_id])) {
                $empHours[$t->employee_id] = 0;
            }
            $empHours[$t->employee_id] += $t->hours;
        }

        $covRegion = [];
        $covCompany = [];
        $covDept = [];
        $covLevel = [];
        $titlesByLevel = [];
        $jobTitlesTable = [];

        $hrsGen = [];
        $hrsLevel = [];
        $hrsGender = [];

        $retirementTraining = [
            '0_jam' => 0,
            '1_15_jam' => 0,
            '16_plus_jam' => 0,
        ];

        $newHireNoTrainingCount = MetricsHelper::countNewHireNoTraining($employees, $asOf, $empHours);
        $scatter = [];
        $companyRanking = [];

        foreach ($employees as $e) {
            $hasTraining = isset($empHours[$e->id]);
            $hours = $hasTraining ? $empHours[$e->id] : 0;

            $reg = $e->region ?? 'Unknown';
            $cid = $e->company_id ?? 0;
            $dept = $e->organization_name ?? 'Unknown';
            $lvl = $e->job_level_code ?? 'Unknown';
            $gender = $e->gender ?? 'Unknown';
            $jt = $e->job_title_name ? trim($e->job_title_name) : 'Tidak Diketahui';

            if ($lvl && $e->job_title_name) {
                $titlesByLevel[$lvl][$e->job_title_name] = ($titlesByLevel[$lvl][$e->job_title_name] ?? 0) + 1;
            }

            $lvlStr = ($lvl !== null && $lvl !== '' && $lvl !== 'Unknown') ? (string) $lvl : '-';
            $jtKey = $jt.'||'.$lvlStr;

            if (! isset($jobTitlesTable[$jtKey])) {
                $jobTitlesTable[$jtKey] = [
                    'title' => $jt,
                    'level' => $lvlStr,
                    'hc' => 0,
                    'trained_hc' => 0,
                    'hours_sum' => 0,
                ];
            }
            $jobTitlesTable[$jtKey]['hc']++;
            if ($hasTraining) {
                $jobTitlesTable[$jtKey]['trained_hc']++;
                $jobTitlesTable[$jtKey]['hours_sum'] += $hours;
            }

            if (! isset($covRegion[$reg])) {
                $covRegion[$reg] = ['total' => 0, 'trained' => 0];
            }
            if (! isset($covCompany[$cid])) {
                $covCompany[$cid] = ['total' => 0, 'trained' => 0];
            }
            if (! isset($covDept[$dept])) {
                $covDept[$dept] = ['total' => 0, 'trained' => 0];
            }
            if (! isset($covLevel[$lvl])) {
                $covLevel[$lvl] = ['total' => 0, 'trained' => 0];
            }

            $covRegion[$reg]['total']++;
            $covCompany[$cid]['total']++;
            $covDept[$dept]['total']++;
            $covLevel[$lvl]['total']++;

            if ($hasTraining) {
                $covRegion[$reg]['trained']++;
                $covCompany[$cid]['trained']++;
                $covDept[$dept]['trained']++;
                $covLevel[$lvl]['trained']++;
            }

            $birth = $e->birth_date ? Carbon::parse($e->birth_date) : null;
            $ageFloat = Demographics::age($birth, $asOf);
            $gen = Demographics::generation($birth ? $birth->year : null);

            $join = $e->join_date ? Carbon::parse($e->join_date) : null;
            $tenureFloat = Demographics::los($join, $asOf);

            if ($hasTraining) {
                if (! isset($hrsGen[$gen])) {
                    $hrsGen[$gen] = ['hours' => 0, 'linked_hc' => 0];
                }
                if (! isset($hrsLevel[$lvl])) {
                    $hrsLevel[$lvl] = ['hours' => 0, 'linked_hc' => 0];
                }
                if (! isset($hrsGender[$gender])) {
                    $hrsGender[$gender] = ['hours' => 0, 'linked_hc' => 0];
                }

                $hrsGen[$gen]['hours'] += $hours;
                $hrsGen[$gen]['linked_hc']++;

                $hrsLevel[$lvl]['hours'] += $hours;
                $hrsLevel[$lvl]['linked_hc']++;

                $hrsGender[$gender]['hours'] += $hours;
                $hrsGender[$gender]['linked_hc']++;
            }

            $isRisk = Demographics::isRetirementRisk($birth, $asOf);
            if ($isRisk) {
                if ($hours == 0) {
                    $retirementTraining['0_jam']++;
                } elseif ($hours <= 15) {
                    $retirementTraining['1_15_jam']++;
                } else {
                    $retirementTraining['16_plus_jam']++;
                }
            }

            // Removed new hire no training inline calculation

            if ($tenureFloat !== null && $hasTraining) {
                $scatter[] = [
                    'masa_kerja' => round($tenureFloat, 2),
                    'jam_pelatihan' => round($hours, 1),
                ];
            }

            if (! isset($companyRanking[$cid])) {
                $companyRanking[$cid] = [
                    'hc' => 0, 'age_sum' => 0, 'age_count' => 0,
                    'linked_hc' => 0, 'hours_sum' => 0, 'risk_count' => 0,
                ];
            }
            $companyRanking[$cid]['hc']++;
            if ($ageFloat !== null) {
                $companyRanking[$cid]['age_sum'] += $ageFloat;
                $companyRanking[$cid]['age_count']++;
            }
            if ($hasTraining) {
                $companyRanking[$cid]['linked_hc']++;
                $companyRanking[$cid]['hours_sum'] += $hours;
            }
            if ($isRisk) {
                $companyRanking[$cid]['risk_count']++;
            }
        }

        $formatCoverage = function ($map, $attachTitles = false) use (&$titlesByLevel) {
            $res = [];
            foreach ($map as $name => $data) {
                $pct = $data['total'] > 0 ? ($data['trained'] / $data['total']) * 100 : 0;
                $row = ['name' => $name, 'trained' => $data['trained'], 'total' => $data['total'], 'pct' => round($pct, 1)];
                if ($attachTitles && isset($titlesByLevel[$name])) {
                    $top = $titlesByLevel[$name];
                    arsort($top);
                    $row['top_titles'] = $top;
                }
                $res[] = $row;
            }
            usort($res, fn ($a, $b) => $b['pct'] <=> $a['pct']);

            return $res;
        };

        $formatAvg = function ($map, $attachTitles = false) use (&$titlesByLevel) {
            $res = [];
            foreach ($map as $name => $data) {
                $avg = $data['linked_hc'] > 0 ? $data['hours'] / $data['linked_hc'] : 0;
                $row = ['name' => $name, 'avg_hours' => round($avg, 1), 'total_hours' => $data['hours'], 'linked_hc' => $data['linked_hc']];
                if ($attachTitles && isset($titlesByLevel[$name])) {
                    $top = $titlesByLevel[$name];
                    arsort($top);
                    $row['top_titles'] = $top;
                }
                $res[] = $row;
            }
            usort($res, fn ($a, $b) => $b['avg_hours'] <=> $a['avg_hours']);

            return $res;
        };

        $companyIds = array_keys($companyRanking);
        $companyNames = DB::table('companies')->whereIn('id', $companyIds)->pluck('name', 'id');

        $companyRankTable = [];
        foreach ($companyRanking as $cid => $data) {
            $name = $companyNames[$cid] ?? 'Unknown';
            $avgAge = $data['age_count'] > 0 ? $data['age_sum'] / $data['age_count'] : 0;
            $cov = $data['hc'] > 0 ? ($data['linked_hc'] / $data['hc']) * 100 : 0;
            $avgHours = $data['linked_hc'] > 0 ? $data['hours_sum'] / $data['linked_hc'] : 0;
            $riskPct = $data['hc'] > 0 ? ($data['risk_count'] / $data['hc']) * 100 : 0;

            $companyRankTable[] = [
                'id' => $cid,
                'name' => $name,
                'hc' => $data['hc'],
                'avg_age' => round($avgAge, 1),
                'trained_hc' => $data['linked_hc'],
                'coverage' => round($cov, 1),
                'total_hours' => round($data['hours_sum'], 1),
                'avg_hours' => round($avgHours, 1),
                'risk_pct' => round($riskPct, 1),
            ];
        }
        usort($companyRankTable, fn ($a, $b) => $b['coverage'] <=> $a['coverage']);

        $covCompanyNamed = [];
        foreach ($covCompany as $cid => $data) {
            $name = $companyNames[$cid] ?? 'Unknown';
            $covCompanyNamed[$name] = $data;
        }

        $jobTitlesRanking = [];
        foreach ($jobTitlesTable as $data) {
            $covPct = $data['hc'] > 0 ? ($data['trained_hc'] / $data['hc']) * 100 : 0;
            $avgHours = $data['trained_hc'] > 0 ? ($data['hours_sum'] / $data['trained_hc']) : 0;
            $pctOfTotal = $totalEmployees > 0 ? ($data['hc'] / $totalEmployees) * 100 : 0;

            $jobTitlesRanking[] = [
                'title' => $data['title'],
                'level' => $data['level'],
                'hc' => $data['hc'],
                'pct_of_total' => round($pctOfTotal, 2),
                'trained_hc' => $data['trained_hc'],
                'coverage' => round($covPct, 1),
                'total_hours' => round($data['hours_sum'], 1),
                'avg_hours' => round($avgHours, 1),
            ];
        }
        usort($jobTitlesRanking, fn ($a, $b) => $b['hc'] <=> $a['hc']);

        return [
            'banner' => $banner,
            'coverage' => [
                'region' => $formatCoverage($covRegion),
                'company' => $formatCoverage($covCompanyNamed),
                'dept' => $formatCoverage($covDept),
                'level' => $formatCoverage($covLevel, true),
            ],
            'hours' => [
                'generation' => $formatAvg($hrsGen),
                'level' => $formatAvg($hrsLevel, true),
                'gender' => $formatAvg($hrsGender),
            ],
            'retirement_training' => $retirementTraining,
            'new_hire_no_training' => $newHireNoTrainingCount,
            'scatter' => $scatter,
            'company_ranking' => $companyRankTable,
            'job_titles_ranking' => $jobTitlesRanking,
        ];
    }

    private function emptyMetrics()
    {
        return [
            'banner' => null,
            'coverage' => ['region' => [], 'company' => [], 'dept' => [], 'level' => []],
            'hours' => ['generation' => [], 'level' => [], 'gender' => []],
            'retirement_training' => ['0_jam' => 0, '1_15_jam' => 0, '16_plus_jam' => 0],
            'new_hire_no_training' => 0,
            'scatter' => [],
            'company_ranking' => [],
            'job_titles_ranking' => [],
        ];
    }
}
