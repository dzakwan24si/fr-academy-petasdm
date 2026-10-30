<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class EmployeeFilter
{
    public static function apply(Builder $query, Request $request): Builder
    {
        $getArrayInput = fn (string $key): array => collect(Arr::flatten((array) $request->input($key, [])))
            ->filter(fn ($v) => $v !== null && $v !== '' && $v !== 'all')
            ->values()
            ->all();

        $regions = $getArrayInput('region');
        if (! empty($regions)) {
            $query->whereIn('region', $regions);
        }

        $groups = $getArrayInput('group');
        if (! empty($groups)) {
            $query->whereIn('group', $groups);
        }

        $companies = $getArrayInput('company_id');
        if (! empty($companies)) {
            $query->whereIn('company_id', $companies);
        }

        $locations = $getArrayInput('location_id');
        if (! empty($locations)) {
            $query->whereIn('location_id', $locations);
        }

        $orgs = $getArrayInput('organization_name');
        if (! empty($orgs)) {
            $query->whereIn('organization_name', $orgs);
        }

        $jobLevels = $getArrayInput('job_level_code');
        if (! empty($jobLevels)) {
            $query->whereIn('job_level_code', $jobLevels);
        }

        $empTypes = $getArrayInput('employment_type');
        if (! empty($empTypes)) {
            $query->whereIn('employment_type', $empTypes);
        }

        $genders = $getArrayInput('gender');
        if (! empty($genders)) {
            $query->whereIn('gender', $genders);
        }

        $generations = $getArrayInput('generation');
        if (! empty($generations)) {
            $config = config('sdm.generations', [
                'Boomers' => 1964,
                'Gen X' => 1980,
                'Gen Y' => 1996,
            ]);

            $query->where(function ($q) use ($generations, $config) {
                foreach ($generations as $gen) {
                    if ($gen === 'Boomers') {
                        $q->orWhereYear('birth_date', '<=', $config['Boomers']);
                    } elseif ($gen === 'Gen X') {
                        $q->orWhereBetween(DB::raw('YEAR(birth_date)'), [$config['Boomers'] + 1, $config['Gen X']]);
                    } elseif ($gen === 'Gen Y') {
                        $q->orWhereBetween(DB::raw('YEAR(birth_date)'), [$config['Gen X'] + 1, $config['Gen Y']]);
                    } elseif ($gen === 'Gen Z') {
                        $q->orWhereYear('birth_date', '>', $config['Gen Y']);
                    }
                }
            });
        }

        return $query;
    }
}
