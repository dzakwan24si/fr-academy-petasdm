<?php

namespace App\Support;

use Illuminate\Contracts\Database\Query\Builder;
use Illuminate\Http\Request;

class TrainingFilter
{
    public static function apply(Builder $query, Request $request): Builder
    {

        if ($request->filled('year')) {
            $query->whereIn('year', (array) $request->input('year'));
        }
        if ($request->filled('month')) {
            $query->whereIn('month', (array) $request->input('month'));
        }
        if ($request->filled('training_name')) {
            $query->where('training_name', 'like', '%'.$request->input('training_name').'%');
        }
        if ($request->filled('regularity')) {
            $query->whereIn('regularity', (array) $request->input('regularity'));
        }
        if ($request->filled('source_type')) {
            $query->whereIn('source_type', (array) $request->input('source_type'));
        }
        if ($request->filled('company_id')) {
            $query->whereIn('company_id', (array) $request->input('company_id'));
        }
        if ($request->filled('region')) {
            $query->whereIn('region', (array) $request->input('region'));
        }

        return $query;
    }
}
