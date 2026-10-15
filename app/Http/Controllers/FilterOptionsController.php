<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Location;
use Illuminate\Support\Facades\DB;

class FilterOptionsController extends Controller
{
    public function index()
    {
        // For distinct options, we can query Employee, Company, Location
        // Since dataset is small, doing distinct queries is fine

        $companies = Company::orderBy('name')->get(['id', 'code', 'name']);

        $employeeOptions = Employee::query()->get([
            'region', 'group', 'organization_name', 'job_level_code', 'employment_type', 'gender', 'location_id', 'company_id',
        ]);

        $regions = $employeeOptions->pluck('region')->unique()->filter()->sort()->values();
        $groups = $employeeOptions->pluck('group')->unique()->filter()->sort()->values();
        $departments = $employeeOptions->pluck('organization_name')->unique()->filter()->sort()->values();
        $jobLevels = $employeeOptions->pluck('job_level_code')->unique()->filter()->sort()->values();
        $employmentTypes = $employeeOptions->pluck('employment_type')->unique()->filter()->sort()->values();
        $genders = $employeeOptions->pluck('gender')->unique()->filter()->sort()->values();

        $locationsMap = [];
        foreach ($employeeOptions as $emp) {
            if ($emp->location_id) {
                if (! isset($locationsMap[$emp->location_id])) {
                    $locationsMap[$emp->location_id] = [];
                }
                $locationsMap[$emp->location_id][] = $emp->company_id;
            }
        }

        $activeLocationIds = array_keys($locationsMap);
        $locations = Location::whereIn('id', $activeLocationIds)->orderBy('name')->get(['id', 'name'])->map(function ($loc) use ($locationsMap) {
            return [
                'id' => $loc->id,
                'name' => $loc->name,
                'companies' => array_values(array_unique($locationsMap[$loc->id] ?? [])),
            ];
        });

        // Generations are static
        $generations = ['Boomers', 'Gen X', 'Gen Y', 'Gen Z'];

        $trainingRegions = DB::table('training_records')
            ->select('region')
            ->distinct()
            ->whereNotNull('region')
            ->pluck('region')
            ->sort()
            ->values();

        return response()->json([
            'regions' => $regions,
            'trainingRegions' => $trainingRegions,
            'groups' => $groups,
            'companies' => $companies,
            'locations' => $locations,
            'departments' => $departments,
            'jobLevels' => $jobLevels,
            'employmentTypes' => $employmentTypes,
            'genders' => $genders,
            'generations' => $generations,
        ]);
    }
}
