<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class EmployeeFilter
{
    public static function apply(Builder $query, Request $request): Builder
    {

        if ($request->filled('region')) {
            $query->whereIn('region', (array) $request->input('region'));
        }
        if ($request->filled('group')) {
            $query->whereIn('group', (array) $request->input('group'));
        }
        if ($request->filled('company_id')) {
            $query->whereIn('company_id', (array) $request->input('company_id'));
        }
        if ($request->filled('location_id')) {
            $query->whereIn('location_id', (array) $request->input('location_id'));
        }
        if ($request->filled('organization_name')) {
            $query->whereIn('organization_name', (array) $request->input('organization_name'));
        }
        if ($request->filled('job_level_code')) {
            $query->whereIn('job_level_code', (array) $request->input('job_level_code'));
        }
        if ($request->filled('employment_type')) {
            $query->whereIn('employment_type', (array) $request->input('employment_type'));
        }
        if ($request->filled('gender')) {
            $query->whereIn('gender', (array) $request->input('gender'));
        }
        // Generation filter requires filtering by birth_date logic, which might be tricky in pure SQL.
        // It's usually better handled locally, or we compute the min/max birth dates for generations.
        if ($request->filled('generation')) {
            $generations = (array) $request->input('generation');
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
