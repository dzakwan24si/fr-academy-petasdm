<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DataQualityController extends Controller
{
    public function index()
    {
        $totalTrainedRows = DB::table('training_records')->count();
        $nikOk = DB::table('training_records')->where('nik_status', 'ok')->count();
        $nikEmpty = DB::table('training_records')->where('nik_status', 'empty')->count();
        $nikCorrupt = DB::table('training_records')->where('nik_status', 'corrupt')->count();
        $nikInvalid = DB::table('training_records')->where('nik_status', 'invalid')->count();
        $unmatched = DB::table('training_records')->where('nik_status', 'ok')->whereNull('employee_id')->count();

        $aliasTotal = DB::table('company_aliases')->count();
        $aliasUnmatched = DB::table('company_aliases')->whereNull('company_id')->count();

        return Inertia::render('Admin/DataQuality', [
            'stats' => [
                'training_rows' => $totalTrainedRows,
                'nik_ok' => $nikOk,
                'nik_empty' => $nikEmpty,
                'nik_corrupt' => $nikCorrupt,
                'nik_invalid' => $nikInvalid,
                'unmatched_nik' => $unmatched,
                'alias_total' => $aliasTotal,
                'alias_unmatched' => $aliasUnmatched,
            ],
        ]);
    }
}
