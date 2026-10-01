<?php

namespace App\Support;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Support\Demographics;

class MetricsHelper
{
    /**
     * Menghitung jumlah karyawan dengan masa kerja < 1 tahun yang TIDAK punya training.
     * Menggunakan logika yang persis sama dengan CombinedMetrics.
     * 
     * @param \Illuminate\Support\Collection $employees Koleksi object karyawan (minimal punya id, join_date)
     * @param \Carbon\Carbon $asOf
     * @param array|null $empHours Array assoc [employee_id => total_hours] (opsional untuk optimalisasi)
     * @return int
     */
    public static function countNewHireNoTraining(Collection $employees, Carbon $asOf, ?array $empHours = null): int
    {
        if ($empHours === null) {
            $empIds = $employees->pluck('id')->toArray();
            $trainings = DB::table('training_records')
                ->whereNotNull('employee_id')
                ->whereIn('employee_id', $empIds)
                ->get(['employee_id', 'hours']);

            $empHours = [];
            foreach ($trainings as $t) {
                if (!isset($empHours[$t->employee_id])) $empHours[$t->employee_id] = 0;
                $empHours[$t->employee_id] += $t->hours;
            }
        }

        $count = 0;
        foreach ($employees as $e) {
            $hasTraining = isset($empHours[$e->id]);
            $join = $e->join_date ? Carbon::parse($e->join_date) : null;
            $tenureFloat = Demographics::los($join, $asOf);
            
            if ($tenureFloat !== null && $tenureFloat < 1 && !$hasTraining) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * Menghitung karyawan yang masuk di tahun yang sama dengan $asOf.
     */
    public static function countNewHireThisYear(Collection $employees, Carbon $asOf): int
    {
        $count = 0;
        $targetYear = $asOf->year;
        
        foreach ($employees as $e) {
            $join = $e->join_date ? Carbon::parse($e->join_date) : null;
            if ($join !== null && $join->year === $targetYear) {
                $count++;
            }
        }
        
        return $count;
    }
}
