<?php

namespace App\Services;

use Illuminate\Http\Request;
use App\Support\EmployeeFilter;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RetirementMetrics
{
    public function getMetrics(Request $request, EmployeeFilter $filter)
    {
        $query = \App\Models\Employee::query();
        $query = $filter->apply($query, $request);

        $employees = $query->get([
            'birth_date', 'region', 'job_level_code', 'organization_name', 'company_id', 'job_title_name'
        ]);

        if ($employees->isEmpty()) {
            return $this->emptyMetrics();
        }

        $asOf = $request->input('as_of') ? Carbon::parse($request->input('as_of')) : Carbon::today();
        $retireAge = config('sdm.retirement_age', 55);

        $kpi = [
            'now' => 0,
            '1_year' => 0,
            '3_years' => 0,
            '5_years' => 0,
        ];

        $projection = [];
        $currentYear = $asOf->year;
        for ($i = 0; $i <= 5; $i++) {
            $projection[$currentYear + $i] = 0;
        }

        $byLevel = [];
        $byDept = [];
        $byRegion = [];
        $byCompanyId = [];
        
        $concentratedPositions = [];

        foreach ($employees as $e) {
            if (!$e->birth_date) continue;

            $birth = Carbon::parse($e->birth_date);
            $ageFloat = $birth->diffInMonths($asOf) / 12;

            $retireDate = $birth->copy()->addYears($retireAge);
            $yearsToRetireFloat = $asOf->diffInMonths($retireDate, false) / 12; 
            
            $isRetireNow = $ageFloat >= $retireAge;
            $in1Year = $yearsToRetireFloat <= 1; 
            $in3Years = $yearsToRetireFloat <= 3;
            $in5Years = $yearsToRetireFloat <= 5;

            if ($isRetireNow) $kpi['now']++;
            if ($in1Year) $kpi['1_year']++;
            if ($in3Years) $kpi['3_years']++;
            if ($in5Years) $kpi['5_years']++;

            $rYear = $retireDate->year;
            if ($isRetireNow || $rYear <= $currentYear) {
                $projection[$currentYear]++; 
            } elseif ($rYear <= $currentYear + 5) {
                $projection[$rYear]++;
            }

            $lvl = $e->job_level_code ?? 'Unknown';
            $dept = $e->organization_name ?? 'Unknown';
            $reg = $e->region ?? 'Unknown';
            $cid = $e->company_id ?? 0;
            $title = $e->job_title_name ?? 'Unknown';

            if (!isset($byLevel[$lvl])) $byLevel[$lvl] = ['total' => 0, 'risk' => 0];
            if (!isset($byDept[$dept])) $byDept[$dept] = ['total' => 0, 'risk' => 0];
            if (!isset($byRegion[$reg])) $byRegion[$reg] = ['total' => 0, 'risk' => 0];
            if (!isset($byCompanyId[$cid])) $byCompanyId[$cid] = ['total' => 0, 'risk' => 0];
            
            if (!isset($concentratedPositions[$title])) {
                $concentratedPositions[$title] = ['total' => 0, 'risk_3y' => 0];
            }

            $byLevel[$lvl]['total']++;
            $byDept[$dept]['total']++;
            $byRegion[$reg]['total']++;
            $byCompanyId[$cid]['total']++;
            $concentratedPositions[$title]['total']++;

            if ($isRetireNow) {
                $byLevel[$lvl]['risk']++;
                $byDept[$dept]['risk']++;
                $byRegion[$reg]['risk']++;
                $byCompanyId[$cid]['risk']++;
            }
            
            if ($ageFloat >= ($retireAge - 3)) {
                $concentratedPositions[$title]['risk_3y']++;
            }
        }

        $companyIds = array_keys($byCompanyId);
        $companyNames = DB::table('companies')->whereIn('id', $companyIds)->pluck('name', 'id');
        
        $byCompany = [];
        foreach ($byCompanyId as $cid => $data) {
            $name = $companyNames[$cid] ?? 'Unknown';
            $byCompany[$name] = ($byCompany[$name] ?? 0) + $data['risk']; 
        }
        
        $regionRisk = [];
        foreach ($byRegion as $reg => $data) {
            $regionRisk[$reg] = $data['risk'];
        }

        $levelTable = [];
        foreach ($byLevel as $lvl => $data) {
            $pct = $data['total'] > 0 ? ($data['risk'] / $data['total']) * 100 : 0;
            $levelTable[] = [
                'name' => $lvl,
                'total' => $data['total'],
                'value' => $data['risk'],
                'pct' => round($pct, 1)
            ];
        }
        usort($levelTable, fn($a, $b) => $b['value'] <=> $a['value']); 

        $deptTable = [];
        foreach ($byDept as $dept => $data) {
            $pct = $data['total'] > 0 ? ($data['risk'] / $data['total']) * 100 : 0;
            $deptTable[] = [
                'name' => $dept,
                'total' => $data['total'],
                'value' => $data['risk'],
                'pct' => round($pct, 1)
            ];
        }
        usort($deptTable, fn($a, $b) => $b['value'] <=> $a['value']);

        $concentratedTable = [];
        foreach ($concentratedPositions as $title => $data) {
            if ($data['risk_3y'] >= 1) {
                $pct = $data['total'] > 0 ? ($data['risk_3y'] / $data['total']) * 100 : 0;
                $concentratedTable[] = [
                    'title' => $title,
                    'total' => $data['total'],
                    'risk' => $data['risk_3y'],
                    'pct' => round($pct, 1)
                ];
            }
        }
        usort($concentratedTable, fn($a, $b) => $b['risk'] <=> $a['risk']);

        return [
            'kpi' => $kpi,
            'projection' => $projection,
            'tables' => [
                'level' => $levelTable,
                'dept' => $deptTable,
                'concentrated' => $concentratedTable,
            ],
            'bars' => [
                'region' => $regionRisk,
                'company' => $byCompany,
            ]
        ];
    }
    
    private function emptyMetrics()
    {
        return [
            'kpi' => ['now' => 0, '1_year' => 0, '3_years' => 0, '5_years' => 0],
            'projection' => [],
            'tables' => ['level' => [], 'dept' => [], 'concentrated' => []],
            'bars' => ['region' => [], 'company' => []],
        ];
    }
}
