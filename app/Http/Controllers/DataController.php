<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Location;
use App\Services\AuditLogger;
use App\Support\Clean;
use App\Support\Demographics;
use App\Support\EmployeeFilter;
use App\Support\TrainingFilter;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DataController extends Controller
{
    /**
     * Endpoint /data/map/locations sudah dihapus bersama peta.
     * Method ini ditinggalkan agar tidak 404, redirected ke companies.
     *
     * @deprecated
     */
    public function locations(Request $request, EmployeeFilter $filter)
    {
        return response()->json([]);
    }

    public function companies(Request $request, EmployeeFilter $filter)
    {
        $query = Employee::query();
        $query = $filter->apply($query, $request);

        $employees = $query->get(['company_id', 'location_id', 'region', 'birth_date']);
        $companyIds = $employees->pluck('company_id')->unique()->filter();

        // Ambil semua lokasi terkait secara bulk
        $locationIds = $employees->pluck('location_id')->unique()->filter();
        $locations = Location::whereIn('id', $locationIds)->get(['id', 'code', 'name'])->keyBy('id');

        $companies = Company::whereIn('id', $companyIds)->get()->map(function ($c) use ($employees, $locations) {
            $emps = $employees->where('company_id', $c->id);

            // Lokasi unit untuk perusahaan ini
            $companyLocIds = $emps->pluck('location_id')->unique()->filter();
            $companyLocations = $companyLocIds->map(fn ($id) => $locations->get($id))->filter();
            $locNames = $companyLocations->pluck('name')->filter()->values()->all();
            $locCodes = $companyLocations->pluck('code')->filter()->values()->all();

            // Hitung generasi mini untuk generation bar di galeri
            $generations = [];
            foreach ($emps as $e) {
                if ($e->birth_date) {
                    $g = Demographics::generation(Carbon::parse($e->birth_date)->year);
                    if ($g) {
                        $generations[$g] = ($generations[$g] ?? 0) + 1;
                    }
                }
            }

            $meta = Clean::companyMeta($c->name, $locNames);

            return [
                'id' => $c->id,
                'code' => $c->code,
                'name' => $c->name,
                'group' => $c->group,
                'employee_count' => $emps->count(),
                'location_count' => $companyLocIds->count(),
                'region' => Clean::region($emps->first()->region ?? $c->region) ?? 'Unknown',
                'generations' => $generations,
                'initials' => $meta['initials'],
                'aliases' => $meta['aliases'],
                'facilities' => Clean::facilities($locNames),
                'location_names' => $locNames,
                'location_codes' => $locCodes,
            ];
        })->sortByDesc('employee_count')->values();

        return response()->json([
            'data' => $companies,
            'total_locations' => $employees->pluck('location_id')->unique()->filter()->count(),
        ]);
    }

    public function companyProfile(Request $request, Company $company, EmployeeFilter $filter)
    {
        $user = $request->user();

        // Daftar lengkap seluruh unit operasional perusahaan (tetap utuh meskipun sedang difilter lokasi)
        $allCompanyEmployees = Employee::query()->where('company_id', $company->id)->get(['id', 'location_id']);
        $totalCompanyHc = $allCompanyEmployees->count();

        $allLocIds = $allCompanyEmployees->pluck('location_id')->filter()->unique();
        $locNames = Location::whereIn('id', $allLocIds)->pluck('name', 'id');
        $locCounts = $allCompanyEmployees->groupBy('location_id')->map(fn ($g) => $g->count());

        $locDetails = [];
        foreach ($allLocIds as $locId) {
            $locDetails[] = [
                'id' => $locId,
                'name' => $locNames[$locId] ?? 'Unknown',
                'count' => $locCounts[$locId] ?? 0,
            ];
        }
        usort($locDetails, fn ($a, $b) => $b['count'] <=> $a['count']);

        // Filter diterapkan untuk menghitung analitik spesifik (misal per kebun/pabrik/unit)
        $query = Employee::query()->where('company_id', $company->id);
        $query = $filter->apply($query, $request);
        $employees = $query->get();

        $totalHc = $employees->count();
        if ($totalHc === 0 && ! $request->filled('location_id')) {
            return response()->json(['error' => 'No data'], 404);
        }

        $females = $employees->where('gender', 'Female')->count();
        $perm = $employees->filter(fn ($e) => in_array($e->employment_type, ['PERM', 'PERMANENT'], true))->count();

        // Untuk umur dan masa kerja, ambil yg valid saja
        $ages = $employees->map(fn ($e) => Demographics::age(Carbon::parse($e->birth_date)))->filter();
        $loses = $employees->map(fn ($e) => Demographics::los(Carbon::parse($e->join_date)))->filter();

        $avgAge = $ages->count() > 0 ? $ages->average() : 0;
        $avgLos = $loses->count() > 0 ? $loses->average() : 0;

        // Demografi: Generasi
        $generations = [];
        foreach ($employees as $e) {
            $g = Demographics::generation(Carbon::parse($e->birth_date)->year);
            if ($g) {
                $generations[$g] = ($generations[$g] ?? 0) + 1;
            }
        }

        // Job Level
        $levels = [];
        foreach ($employees as $e) {
            if ($e->job_level_code) {
                $levels[$e->job_level_code] = ($levels[$e->job_level_code] ?? 0) + 1;
            }
        }

        // Department
        $depts = [];
        foreach ($employees as $e) {
            if ($e->organization_name) {
                $depts[$e->organization_name] = ($depts[$e->organization_name] ?? 0) + 1;
            }
        }
        arsort($depts);
        $depts = array_slice($depts, 0, 8);

        // Ringkasan pelatihan perusahaan (dari baris terhubung saja)
        $empIds = $employees->pluck('id')->all();
        $trainings = DB::table('training_records')
            ->whereIn('employee_id', $empIds)
            ->get(['employee_id', 'training_name', 'hours', 'regularity', 'source_type']);

        $totalTrainingHours = round((float) $trainings->sum('hours'), 1);
        $trainedHc = $trainings->pluck('employee_id')->unique()->count();
        $trainingCoverage = $totalHc > 0 ? round(($trainedHc / $totalHc) * 100, 1) : 0;
        $avgHoursPerTrainee = $trainedHc > 0 ? round($totalTrainingHours / $trainedHc, 1) : 0;

        // Analisis Demografi Mendalam: Usia Bins & Gender
        $ageBins = [
            '<25' => ['name' => '<25', 'Male' => 0, 'Female' => 0, 'total' => 0],
            '25-29' => ['name' => '25-29', 'Male' => 0, 'Female' => 0, 'total' => 0],
            '30-34' => ['name' => '30-34', 'Male' => 0, 'Female' => 0, 'total' => 0],
            '35-39' => ['name' => '35-39', 'Male' => 0, 'Female' => 0, 'total' => 0],
            '40-44' => ['name' => '40-44', 'Male' => 0, 'Female' => 0, 'total' => 0],
            '45-49' => ['name' => '45-49', 'Male' => 0, 'Female' => 0, 'total' => 0],
            '50-54' => ['name' => '50-54', 'Male' => 0, 'Female' => 0, 'total' => 0],
            '55+' => ['name' => '55+', 'Male' => 0, 'Female' => 0, 'total' => 0],
        ];

        // Analisis Masa Kerja (Tenure) Bins
        $tenureBins = [
            ['name' => '<1 Thn', 'value' => 0],
            ['name' => '1-3 Thn', 'value' => 0],
            ['name' => '3-5 Thn', 'value' => 0],
            ['name' => '5-10 Thn', 'value' => 0],
            ['name' => '10-15 Thn', 'value' => 0],
            ['name' => '15+ Thn', 'value' => 0],
        ];
        $tenureMap = ['<1 Thn' => 0, '1-3 Thn' => 1, '3-5 Thn' => 2, '5-10 Thn' => 3, '10-15 Thn' => 4, '15+ Thn' => 5];

        $asOf = now();
        $cohortYears = [];
        $newHireIds = [];

        foreach ($employees as $e) {
            $gender = $e->gender === 'Female' ? 'Female' : 'Male';

            // Usia
            if ($e->birth_date) {
                $birth = Carbon::parse($e->birth_date);
                $ageFull = Demographics::ageFullYears($birth, $asOf);

                // Age bin
                $bin = '<25';
                if ($ageFull >= 55) {
                    $bin = '55+';
                } elseif ($ageFull >= 50) {
                    $bin = '50-54';
                } elseif ($ageFull >= 45) {
                    $bin = '45-49';
                } elseif ($ageFull >= 40) {
                    $bin = '40-44';
                } elseif ($ageFull >= 35) {
                    $bin = '35-39';
                } elseif ($ageFull >= 30) {
                    $bin = '30-34';
                } elseif ($ageFull >= 25) {
                    $bin = '25-29';
                }

                $ageBins[$bin][$gender]++;
                $ageBins[$bin]['total']++;
            }

            // Masa Kerja
            if ($e->join_date) {
                $join = Carbon::parse($e->join_date);
                $losFull = Demographics::losFullYears($join, $asOf);

                if ($losFull < 1) {
                    $tenureBins[$tenureMap['<1 Thn']]['value']++;
                    $newHireIds[] = $e->id;
                } elseif ($losFull < 3) {
                    $tenureBins[$tenureMap['1-3 Thn']]['value']++;
                } elseif ($losFull < 5) {
                    $tenureBins[$tenureMap['3-5 Thn']]['value']++;
                } elseif ($losFull < 10) {
                    $tenureBins[$tenureMap['5-10 Thn']]['value']++;
                } elseif ($losFull < 15) {
                    $tenureBins[$tenureMap['10-15 Thn']]['value']++;
                } else {
                    $tenureBins[$tenureMap['15+ Thn']]['value']++;
                }

                $cohortYear = $join->year;
                $cohortYears[$cohortYear] = ($cohortYears[$cohortYear] ?? 0) + 1;
            }
        }

        // Sort cohort
        ksort($cohortYears);
        $cohortData = [];
        foreach ($cohortYears as $yr => $cnt) {
            $cohortData[] = ['year' => (string) $yr, 'count' => $cnt];
        }

        // Untrained new hires
        $trainedEmpIds = $trainings->pluck('employee_id')->unique()->all();
        $untrainedNewHires = count(array_diff($newHireIds, $trainedEmpIds));

        // Top trainings
        $topTrainings = $trainings->groupBy('training_name')
            ->map(fn ($grp, $tName) => [
                'name' => $tName,
                'participants' => $grp->pluck('employee_id')->unique()->count(),
                'hours' => round((float) $grp->sum('hours'), 1),
            ])
            ->sortByDesc('participants')
            ->values()
            ->slice(0, 6)
            ->all();

        // Demografi tambahan: status pernikahan & tipe kepegawaian
        $maritalCounts = [];
        $employmentTypeCounts = [];
        foreach ($employees as $e) {
            $m = $e->marital_status ?: 'Lainnya';
            $maritalCounts[$m] = ($maritalCounts[$m] ?? 0) + 1;

            $et = $e->employment_type ?: 'Lainnya';
            $employmentTypeCounts[$et] = ($employmentTypeCounts[$et] ?? 0) + 1;
        }

        // Pelatihan breakdown (regularity & source_type)
        $trainRegularity = [];
        $trainSourceType = [];
        foreach ($trainings as $tr) {
            $r = $tr->regularity ?: 'Non Regular';
            $trainRegularity[$r] = ($trainRegularity[$r] ?? 0) + 1;

            $s = $tr->source_type ?: 'Internal';
            $trainSourceType[$s] = ($trainSourceType[$s] ?? 0) + 1;
        }

        // Opsi filter untuk tab staf
        $allDepts = $employees->pluck('organization_name')->filter()->unique()->sort()->values()->all();
        $availableLevels = array_values(array_filter(array_keys($levels)));
        $availableEmploymentTypes = $employees->pluck('employment_type')->filter()->unique()->sort()->values()->all();

        return response()->json([
            'total_company_hc' => $totalCompanyHc,
            'active_location_id' => $request->filled('location_id') ? (int) $request->input('location_id') : null,
            'facilities' => Clean::facilities($locNames->values()->all()),
            'kpi' => [
                'hc' => $totalHc,
                'avg_age' => round($avgAge, 1),
                'avg_los' => round($avgLos, 1),
                'female_pct' => round(($females / $totalHc) * 100, 1),
                'perm_pct' => round(($perm / $totalHc) * 100, 1),
                'new_hires' => count($newHireIds),
                'untrained_new_hires' => $untrainedNewHires,
            ],
            'generations' => $generations,
            'levels' => $levels,
            'departments' => $depts,
            'locations' => $locDetails,
            'demografi' => [
                'age_bins' => array_values($ageBins),
                'male_count' => $totalHc - $females,
                'female_count' => $females,
                'marital_status' => $maritalCounts,
                'employment_types' => $employmentTypeCounts,
            ],
            'masa_kerja' => [
                'tenure_bins' => $tenureBins,
                'cohort_years' => $cohortData,
                'avg_los' => round($avgLos, 1),
                'new_hires_count' => count($newHireIds),
            ],
            'training' => [
                'total_hours' => $totalTrainingHours,
                'trained_hc' => $trainedHc,
                'coverage_pct' => $trainingCoverage,
                'avg_hours_per_trainee' => $avgHoursPerTrainee,
                'untrained_new_hires' => $untrainedNewHires,
                'top_trainings' => $topTrainings,
                'regularity' => $trainRegularity,
                'source_type' => $trainSourceType,
            ],
            'filter_options' => [
                'levels' => $availableLevels,
                'departments' => $allDepts,
                'employment_types' => $availableEmploymentTypes,
            ],
        ]);
    }

    public function companyEmployees(Request $request, Company $company, EmployeeFilter $filter)
    {
        $user = $request->user();

        $query = Employee::query()->where('company_id', $company->id);
        $query = $filter->apply($query, $request);

        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%$s%")
                    ->orWhere('employee_id', 'like', "%$s%")
                    ->orWhere('job_title_name', 'like', "%$s%");
            });
        }
        if ($request->location_id) {
            $query->where('location_id', $request->location_id);
        }
        if ($request->level) {
            $query->where('job_level_code', $request->level);
        }
        if ($request->department) {
            $query->where('organization_name', $request->department);
        }
        if ($request->employment_type) {
            $query->where('employment_type', $request->employment_type);
        }

        $employees = $query->paginate(20);

        // Map data yg akan direturn
        $employees->getCollection()->transform(function ($e) {
            return [
                'employee_id' => $e->employee_id,
                'name' => $e->name,
                'job_title_name' => $e->job_title_name,
                'job_level_code' => $e->job_level_code,
                'department' => $e->organization_name,
                'employment_type' => $e->employment_type,
                'age' => Demographics::ageFullYears(Carbon::parse($e->birth_date)),
                'los' => Demographics::losFullYears(Carbon::parse($e->join_date)),
                'photo_url' => $e->photo_url,
            ];
        });

        return response()->json($employees);
    }

    public function cohortEmployees(Request $request, int $year, EmployeeFilter $filter)
    {
        $query = Employee::query()->whereYear('join_date', $year);
        $query = $filter->apply($query, $request);

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('employee_id', 'like', "%{$s}%")
                    ->orWhere('job_title_name', 'like', "%{$s}%");
            });
        }

        if ($request->filled('level')) {
            $query->where('job_level_code', $request->input('level'));
        }

        if ($request->filled('employment_type')) {
            $query->where('employment_type', $request->input('employment_type'));
        }

        if ($request->filled('region')) {
            $query->where('region', $request->input('region'));
        }

        $employees = $query->with('company:id,code,name')->orderBy('name')->paginate(15);

        $employees->getCollection()->transform(function ($e) {
            return [
                'id' => $e->id,
                'employee_id' => $e->employee_id,
                'name' => $e->name,
                'job_title_name' => $e->job_title_name,
                'job_level_code' => $e->job_level_code,
                'department' => $e->organization_name,
                'company_code' => $e->company?->code ?? '-',
                'company_name' => $e->company?->name ?? '-',
                'region' => $e->region,
                'gender' => $e->gender,
                'employment_type' => $e->employment_type,
                'join_date' => $e->join_date ? Carbon::parse($e->join_date)->translatedFormat('d M Y') : '-',
                'age' => Demographics::ageFullYears(Carbon::parse($e->birth_date)),
                'los' => Demographics::losFullYears(Carbon::parse($e->join_date)),
                'photo_url' => $e->photo_url,
            ];
        });

        return response()->json($employees);
    }

    public function employeeDetail(Request $request, string $employee_id, EmployeeFilter $filter)
    {
        $user = $request->user();
        $employee = Employee::where('employee_id', $employee_id)->firstOrFail();

        // Catat audit log
        AuditLogger::log(
            $user->id,
            'VIEW_EMPLOYEE_DETAIL',
            Employee::class,
            $employee->id,
            ['description' => "Viewed detail of employee: {$employee->employee_id}"]
        );

        $company = Company::find($employee->company_id);
        $location = Location::find($employee->location_id);

        $birthDate = Carbon::parse($employee->birth_date);
        $age = Demographics::ageFullYears($birthDate);
        $retireYear = $birthDate->copy()->addYears(55)->format('d M Y');
        $isRetireRisk = $age >= 55;

        // Trainings
        $trainings = DB::table('training_records')->where('nik', $employee->employee_id)->get();

        return response()->json([
            'identitas' => [
                'name' => $employee->name,
                'employee_id' => $employee->employee_id,
                'job' => $employee->job_title_code.' - '.$employee->job_title_name,
                'level' => $employee->job_level_code,
                'dept' => $employee->organization_code.' - '.$employee->organization_name,
                'company' => $company->name ?? '-',
                'location' => $location->name ?? '-',
                'group' => $employee->group,
                'region' => $employee->region,
                'photo_url' => $employee->photo_url,
            ],

            'pribadi' => [
                'gender' => $employee->gender,
                'birth_place' => $employee->birth_place,
                'birth_date' => $birthDate->format('d M Y'),
                'age' => $age,
                'religion' => $employee->religion,
                'marital_status' => $employee->marital_status,
                'ptkp' => $employee->ptkp_code.' ('.$employee->ptkp_name.')',
            ],
            'kepegawaian' => [
                'join_date' => Carbon::parse($employee->join_date)->format('d M Y'),
                'los' => Demographics::losFullYears(Carbon::parse($employee->join_date)),
                'employment_type' => $employee->employment_type,
                'generation' => Demographics::generation($birthDate->year),
                'retire_risk' => $isRetireRisk,
                'retire_date' => $retireYear,
            ],
            'pelatihan' => $trainings->map(function ($t) {
                return [
                    'name' => $t->training_name,
                    'month_year' => $t->month.'/'.$t->year,
                    'hours' => $t->hours,
                    'provider' => $t->instructor,
                    'regularity' => $t->regularity,
                ];
            }),
            'pelatihan_total_jam' => $trainings->sum('hours'),
        ]);
    }

    public function trainings(Request $request, TrainingFilter $filter)
    {
        $query = DB::table('training_records');
        $query = $filter->apply($query, $request);

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where('training_name', 'like', "%{$s}%");
        }

        $events = $query->select(
            'training_name',
            'month',
            'year',
            'source_type',
            DB::raw('COUNT(DISTINCT COALESCE(NULLIF(nik, ""), participant_name)) as participants'),
            DB::raw('SUM(hours) as total_hours')
        )
            ->groupBy('training_name', 'month', 'year', 'source_type');

        $sortField = $request->input('sort', 'year');
        $sortDir = strtolower($request->input('direction', $request->input('order', 'desc'))) === 'asc' ? 'asc' : 'desc';

        $validSorts = ['training_name', 'month', 'year', 'participants', 'total_hours', 'source_type'];
        if (in_array($sortField, $validSorts)) {
            if ($sortField === 'year' || $sortField === 'month') {
                $events->orderBy('year', $sortDir)->orderBy('month', $sortDir);
            } else {
                $events->orderBy($sortField, $sortDir);
            }
        } else {
            $events->orderBy('year', 'desc')->orderBy('month', 'desc');
        }

        $perPage = (int) $request->input('per_page', 10);
        if (! in_array($perPage, [5, 10, 25, 50, 100])) {
            $perPage = 10;
        }

        $paginated = $events->paginate($perPage);

        return response()->json($paginated);
    }
}
