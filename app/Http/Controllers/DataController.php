<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Location;
use App\Services\AuditLogger;
use App\Support\Demographics;
use App\Support\EmployeeFilter;
use App\Support\TrainingFilter;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DataController extends Controller
{
    public function locations(Request $request, EmployeeFilter $filter)
    {
        $query = Employee::query();
        $query = $filter->apply($query, $request);

        $employees = $query->get(['company_id', 'location_id']);
        $locationIds = $employees->pluck('location_id')->unique()->filter();

        $locations = Location::whereIn('id', $locationIds)->get()->map(function ($l) use ($employees) {
            $emps = $employees->where('location_id', $l->id);

            return [
                'id' => $l->id,
                'code' => $l->code,
                'name' => $l->name,
                'latitude' => $l->latitude,
                'longitude' => $l->longitude,
                'facility_type' => $l->facility_type,
                'coordinate_source' => $l->coordinate_source,
                'region' => $emps->first()?->region ?? ($l->name === 'Corporate Office' || str_contains($l->name, 'Jakarta') ? 'Corp' : 'Unknown'),
                'employee_count' => $emps->count(),
                'companies' => $emps->pluck('company_id')->unique()->values(),
            ];
        });

        return response()->json($locations);
    }

    public function companies(Request $request, EmployeeFilter $filter)
    {
        $query = Employee::query();
        $query = $filter->apply($query, $request);

        $employees = $query->get(['company_id', 'location_id', 'region']);
        $companyIds = $employees->pluck('company_id')->unique()->filter();

        $companies = Company::whereIn('id', $companyIds)->get()->map(function ($c) use ($employees) {
            $emps = $employees->where('company_id', $c->id);

            return [
                'id' => $c->id,
                'code' => $c->code,
                'name' => $c->name,
                'employee_count' => $emps->count(),
                'location_count' => $emps->pluck('location_id')->unique()->count(),
                'region' => $emps->first()->region ?? 'Unknown',
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

        $query = Employee::query()->where('company_id', $company->id);
        $query = $filter->apply($query, $request);
        $employees = $query->get();

        $totalHc = $employees->count();
        if ($totalHc === 0) {
            return response()->json(['error' => 'No data'], 404);
        }

        $females = $employees->where('gender', 'Female')->count();
        $perm = $employees->where('employment_type', 'PERM')->count();

        // Untuk umur dan masa kerja, ambil yg valid saja
        $ages = $employees->map(fn ($e) => Demographics::age(Carbon::parse($e->birth_date)))->filter();
        $loses = $employees->map(fn ($e) => Demographics::los(Carbon::parse($e->join_date)))->filter();

        $avgAge = $ages->count() > 0 ? $ages->average() : 0;
        $avgLos = $loses->count() > 0 ? $loses->average() : 0;

        // Pensiun (55 tahun)
        $pensiun = $employees->filter(fn ($e) => Demographics::ageFullYears(Carbon::parse($e->birth_date)) >= 55)->count();

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

        // Lokasi
        $locs = [];
        $locNames = Location::whereIn('id', $employees->pluck('location_id')->unique())->pluck('name', 'id');
        foreach ($employees as $e) {
            if ($e->location_id) {
                $locs[$e->location_id] = ($locs[$e->location_id] ?? 0) + 1;
            }
        }
        $locDetails = [];
        foreach ($locs as $id => $c) {
            $locDetails[] = [
                'id' => $id,
                'name' => $locNames[$id] ?? 'Unknown',
                'count' => $c,
            ];
        }

        return response()->json([
            'kpi' => [
                'hc' => $totalHc,
                'avg_age' => round($avgAge, 1),
                'avg_los' => round($avgLos, 1),
                'female_pct' => round(($females / $totalHc) * 100, 1),
                'perm_pct' => round(($perm / $totalHc) * 100, 1),
                'pensiun' => $pensiun,
            ],
            'generations' => $generations,
            'levels' => $levels,
            'departments' => $depts,
            'locations' => $locDetails,
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
            DB::raw('COUNT(DISTINCT employee_id) as participants'),
            DB::raw('SUM(hours) as total_hours')
        )
            ->groupBy('training_name', 'month', 'year', 'source_type');

        $sortField = $request->input('sort', 'year');
        $sortDir = $request->input('direction', 'desc');

        $validSorts = ['training_name', 'month', 'year', 'participants', 'total_hours', 'source_type'];
        if (in_array($sortField, $validSorts)) {
            if ($sortField === 'year' || $sortField === 'month') {
                $events->orderBy('year', $sortDir)->orderBy('month', $sortDir);
            } else {
                $events->orderBy($sortField, $sortDir);
            }
        }

        $paginated = $events->paginate(15);

        return response()->json($paginated);
    }
}
