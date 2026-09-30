<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\ImportBatch;
use App\Support\Demographics;
use App\Support\EmployeeFilter;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class WorkforceMetrics
{
    protected ?Carbon $asOf;

    public function __construct(?Carbon $asOf = null)
    {
        $this->asOf = $asOf ?? Carbon::now();
    }

    public function getMetrics(\Illuminate\Http\Request $request, EmployeeFilter $filter, \App\Models\User $user)
    {
        // Cache key based on filter hash and latest import batch
        $latestBatch = ImportBatch::latest('id')->first();
        $batchId = $latestBatch ? $latestBatch->id : 0;
        
        $filterHash = md5(json_encode($request->all()) . '_' . $user->id);
        $cacheKey = "metrics_{$batchId}_{$filterHash}";

        return Cache::remember($cacheKey, 3600, function () use ($request, $filter, $user) {
            return $this->calculate($request, $filter, $user);
        });
    }

    protected function calculate(\Illuminate\Http\Request $request, EmployeeFilter $filter, \App\Models\User $user)
    {
        $query = Employee::query();
        $query = $filter->apply($query, $request);
        
        // Single narrow query
        $employees = $query->get([
            'id', 'employee_id', 'company_id', 'location_id', 'region', 'gender', 
            'birth_date', 'join_date', 'employment_type', 'job_level_code',
            'group', 'organization_name', 'marital_status', 'ptkp_code', 'job_title_name', 'birth_place'
        ]);

        $totalHc = $employees->count();
        if ($totalHc === 0) {
            return $this->emptyMetrics();
        }

        $females = 0;
        $perm = 0;
        $pensiun = 0;
        $ages = [];
        $loses = [];
        
        $generations = [];
        $generationsByLevel = [];
        $hcByRegion = [];
        $hcByCompany = [];
        $retireRiskByLevel = [];
        
        $hcByGroup = [];
        $hcByDept = [];
        $agesByDept = [];
        $ageDistribution = ['<25' => 0, '25-29' => 0, '30-34' => 0, '35-39' => 0, '40-44' => 0, '45-49' => 0, '50-54' => 0, '55+' => 0];
        $populationPyramid = [];
        $genByRegion = [];
        $genderByLevel = [];
        $maritalStatus = [];
        $ptkp = [];
        $jobTitles = [];
        $employmentByRegion = [];
        $birthPlaces = [];
        
        $hcByLevel = [];
        
        $employeeIds = [];
        foreach ($employees as $e) {
            $employeeIds[] = $e->id;
            if ($e->gender === 'Female') $females++;
            if ($e->employment_type === 'PERM') $perm++;
            
            $birthDate = $e->birth_date ? Carbon::parse($e->birth_date) : null;
            $joinDate = $e->join_date ? Carbon::parse($e->join_date) : null;
            
            if ($birthDate) {
                $ageDec = Demographics::age($birthDate, $this->asOf);
                $ages[] = $ageDec;
                
                $ageFull = Demographics::ageFullYears($birthDate, $this->asOf);
                if ($ageFull >= config('sdm.retirement_age', 55)) {
                    $pensiun++;
                    $lvl = $e->job_level_code ?? 'Unknown';
                    $retireRiskByLevel[$lvl] = ($retireRiskByLevel[$lvl] ?? 0) + 1;
                }
                
                $gen = Demographics::generation($birthDate->year);
                $generations[$gen] = ($generations[$gen] ?? 0) + 1;
                
                $lvl = $e->job_level_code ?? 'Unknown';
                if (!isset($generationsByLevel[$lvl])) $generationsByLevel[$lvl] = [];
                $generationsByLevel[$lvl][$gen] = ($generationsByLevel[$lvl][$gen] ?? 0) + 1;

                // Demographics additions
                $ageBin = match(true) {
                    $ageFull < 25 => '<25',
                    $ageFull < 30 => '25-29',
                    $ageFull < 35 => '30-34',
                    $ageFull < 40 => '35-39',
                    $ageFull < 45 => '40-44',
                    $ageFull < 50 => '45-49',
                    $ageFull < 55 => '50-54',
                    default => '55+'
                };
                $ageDistribution[$ageBin]++;
                
                if (!isset($populationPyramid[$ageBin])) $populationPyramid[$ageBin] = ['Male' => 0, 'Female' => 0];
                $populationPyramid[$ageBin][$e->gender ?? 'Male']++;
                
                $region = $e->region ?? 'Unknown';
                if (!isset($genByRegion[$region])) $genByRegion[$region] = [];
                $genByRegion[$region][$gen] = ($genByRegion[$region][$gen] ?? 0) + 1;
                
                $dept = $e->organization_name ?? 'Unknown';
                if (!isset($agesByDept[$dept])) $agesByDept[$dept] = [];
                $agesByDept[$dept][] = $ageDec;
            }
            
            $lvl = $e->job_level_code ?? 'Unknown';
            $hcByLevel[$lvl] = ($hcByLevel[$lvl] ?? 0) + 1;
            
            if ($joinDate) {
                $loses[] = Demographics::los($joinDate, $this->asOf);
            }
            
            $region = $e->region ?? 'Unknown';
            $hcByRegion[$region] = ($hcByRegion[$region] ?? 0) + 1;
            
            $hcByCompany[$e->company_id] = ($hcByCompany[$e->company_id] ?? 0) + 1;
            
            // Demographics additions
            $group = $e->group ?? 'Unknown';
            $hcByGroup[$group] = ($hcByGroup[$group] ?? 0) + 1;
            
            $dept = $e->organization_name ?? 'Unknown';
            $hcByDept[$dept] = ($hcByDept[$dept] ?? 0) + 1;
            
            if (!isset($genderByLevel[$lvl])) $genderByLevel[$lvl] = ['Male' => 0, 'Female' => 0];
            $genderByLevel[$lvl][$e->gender ?? 'Male']++;
            
            $ms = $e->marital_status ?? 'Unknown';
            $maritalStatus[$ms] = ($maritalStatus[$ms] ?? 0) + 1;
            
            $pt = $e->ptkp_code ?? 'Unknown';
            $ptkp[$pt] = ($ptkp[$pt] ?? 0) + 1;
            
            $jt = $e->job_title_name ?? 'Unknown';
            $jobTitles[$jt] = ($jobTitles[$jt] ?? 0) + 1;
            
            if (!isset($employmentByRegion[$region])) $employmentByRegion[$region] = [];
            $employmentByRegion[$region][$e->employment_type ?? 'Unknown'] = ($employmentByRegion[$region][$e->employment_type ?? 'Unknown'] ?? 0) + 1;
            
            if ($e->birth_place) {
                $bp = strtoupper(trim($e->birth_place));
                if ($bp === '(NONE)' || $bp === 'NONE' || $bp === '') {
                    $bp = 'TIDAK DIKETAHUI';
                }
                $birthPlaces[$bp] = ($birthPlaces[$bp] ?? 0) + 1;
            }
        }

        $avgAge = count($ages) > 0 ? array_sum($ages) / count($ages) : 0;
        $avgLos = count($loses) > 0 ? array_sum($loses) / count($loses) : 0;
        
        // --- Training Metrics ---
        // Get training records for the filtered employees ONLY for coverage
        // Coverage uses employees in the current filter who have at least 1 training
        $employeesWithTraining = \Illuminate\Support\Facades\DB::table('training_records')
            ->whereIn('employee_id', $employeeIds)
            ->distinct('employee_id')
            ->count('employee_id');
            
        $trainingCoverage = $totalHc > 0 ? round(($employeesWithTraining / $totalHc) * 100, 1) : 0;

        // For total hours and trend, PRD 4.5 says use ALL training records (not filtered by employees)
        $allTrainings = \Illuminate\Support\Facades\DB::table('training_records')
            ->get(['hours', 'month', 'year']);
            
        $totalTrainingHours = $allTrainings->sum('hours');
        
        // Tren jam pelatihan per bulan (year-month) using all trainings
        $trainingTrend = [];
        foreach ($allTrainings as $t) {
            if ($t->year && $t->month) {
                $my = $t->year . '-' . str_pad($t->month, 2, '0', STR_PAD_LEFT);
                $trainingTrend[$my] = ($trainingTrend[$my] ?? 0) + $t->hours;
            }
        }
        ksort($trainingTrend);
        
        // Unlinked training records (nik status tracking for coverage quality)
        // Since we are filtering by employees, unlinked ones won't be here. 
        // We need all training records to report unlinked ones for the whole system, but maybe dashboard just shows total?
        // PRD 4.6 says: Selalu tampilkan dua angka berdampingan: coverage dan "Baris training yang tidak dapat dihubungkan ke karyawan"
        $unlinkedTrainingRows = \Illuminate\Support\Facades\DB::table('training_records')
            ->whereNull('employee_id')
            ->count();
        $totalTrainingRows = \Illuminate\Support\Facades\DB::table('training_records')->count();
        $unlinkedPct = $totalTrainingRows > 0 ? round(($unlinkedTrainingRows / $totalTrainingRows) * 100, 1) : 0;
        
        // Get company names for hcByCompany
        $companyNames = \App\Models\Company::whereIn('id', array_keys($hcByCompany))->pluck('name', 'id');
        $hcByCompanyNamed = [];
        foreach ($hcByCompany as $cid => $hc) {
            $hcByCompanyNamed[$companyNames[$cid] ?? 'Unknown'] = $hc;
        }
        
        $avgAgeByDept = [];
        foreach ($agesByDept as $dept => $agArr) {
            if (count($agArr) >= 5) {
                $avgAgeByDept[$dept] = round(array_sum($agArr) / count($agArr), 1);
            }
        }
        arsort($avgAgeByDept);

        return [
            'total_hc' => $totalHc,
            'avg_age' => round($avgAge, 1),
            'avg_los' => round($avgLos, 1),
            'female_pct' => round(($females / $totalHc) * 100, 1),
            'perm_pct' => round(($perm / $totalHc) * 100, 1),
            'pensiun' => $pensiun,
            'generations' => $generations,
            'generations_by_level' => $generationsByLevel,
            'hc_by_region' => $hcByRegion,
            'hc_by_company' => $hcByCompanyNamed,
            'hc_by_level' => $hcByLevel,
            'retire_risk_by_level' => $retireRiskByLevel,
            'hc_by_group' => $hcByGroup,
            'hc_by_dept' => $hcByDept,
            'age_distribution' => $ageDistribution,
            'population_pyramid' => $populationPyramid,
            'gen_by_region' => $genByRegion,
            'avg_age_by_dept' => $avgAgeByDept,
            'gender_by_level' => $genderByLevel,
            'marital_status' => $maritalStatus,
            'ptkp' => $ptkp,
            'job_titles' => $jobTitles,
            'employment_by_region' => $employmentByRegion,
            'birth_places' => $birthPlaces,
            'level_order' => config('sdm.level_order', []),
            'training' => [
                'total_hours' => $totalTrainingHours,
                'coverage_pct' => $trainingCoverage,
                'unlinked_rows' => $unlinkedTrainingRows,
                'unlinked_pct' => $unlinkedPct,
                'trend' => $trainingTrend
            ],
            'raw_totals' => [
                'total_hc' => $totalHc,
                'generations' => $generations,
                'pensiun' => $pensiun,
            ]
        ];
    }

    private function emptyMetrics()
    {
        return [
            'total_hc' => 0, 'avg_age' => 0, 'avg_los' => 0, 'female_pct' => 0, 'perm_pct' => 0, 'pensiun' => 0,
            'generations' => [], 'generations_by_level' => [], 'hc_by_region' => [], 'hc_by_company' => [], 'hc_by_level' => [], 'retire_risk_by_level' => [],
            'hc_by_group' => [], 'hc_by_dept' => [], 'age_distribution' => [], 'population_pyramid' => [], 'gen_by_region' => [],
            'avg_age_by_dept' => [], 'gender_by_level' => [], 'marital_status' => [], 'ptkp' => [], 'job_titles' => [],
            'employment_by_region' => [], 'birth_places' => [],
            'level_order' => config('sdm.level_order', []),
            'training' => ['total_hours' => 0, 'coverage_pct' => 0, 'unlinked_rows' => 0, 'unlinked_pct' => 0, 'trend' => []],
            'raw_totals' => ['total_hc' => 0, 'generations' => [], 'pensiun' => 0]
        ];
    }
}
