<?php

namespace App\Services;

use App\Models\ImportBatch;
use App\Models\User;
use App\Support\TrainingFilter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class TrainingMetrics
{
    public function getMetrics(Request $request, TrainingFilter $filter, User $user)
    {
        $latestBatch = ImportBatch::latest('id')->first();
        $batchId = $latestBatch ? $latestBatch->id : 0;

        $filterHash = md5(json_encode($request->all()).'_'.$user->id);
        $cacheKey = "training_metrics_{$batchId}_{$filterHash}";

        return Cache::remember($cacheKey, 3600, function () use ($request, $filter) {
            return $this->calculate($request, $filter);
        });
    }

    protected function calculate(Request $request, TrainingFilter $filter)
    {
        $query = DB::table('training_records');
        $query = $filter->apply($query, $request);

        $trainings = $query->get();

        $totalRows = $trainings->count();
        if ($totalRows === 0) {
            return $this->emptyMetrics();
        }

        $uniqueParticipants = [];
        $totalHours = 0;
        $totalDays = 0;
        $uniqueTrainings = [];

        $trend = [];
        $participantsTrend = [];

        $regularity = ['Reguler' => 0, 'Non Reguler' => 0];
        $sourceType = ['Internal' => 0, 'Eksternal' => 0];

        $trainingNames = [];
        $instructors = [];
        $locations = [];

        $hoursByRegion = [];
        $hoursByGroup = [];
        $hoursByDept = [];
        $hoursByGol = []; // Staf / Non Staf
        $hoursByLevel = []; // Workers, Middle, Senior

        $genderByLevel = []; // Stacked bar gender x Level

        $unlinkedRows = 0;

        foreach ($trainings as $t) {
            $totalHours += $t->hours;
            $totalDays += $t->days;
            $uniqueTrainings[$t->training_name] = true;

            if ($t->employee_id) {
                $uniqueParticipants[$t->employee_id] = true;
            } else {
                $unlinkedRows++;
            }

            // Trend
            if ($t->year && $t->month) {
                $my = $t->year.'-'.str_pad($t->month, 2, '0', STR_PAD_LEFT);
                $trend[$my] = ($trend[$my] ?? 0) + $t->hours;

                if (! isset($participantsTrend[$my])) {
                    $participantsTrend[$my] = [];
                }
                if ($t->employee_id) {
                    $participantsTrend[$my][$t->employee_id] = true;
                }
            }

            // Donut
            $reg = $t->regularity ?: 'Unknown';
            $regularity[$reg] = ($regularity[$reg] ?? 0) + 1;

            $src = $t->source_type ?: 'Unknown';
            $sourceType[$src] = ($sourceType[$src] ?? 0) + 1;

            // Top 10
            $tn = $t->training_name ?: 'Unknown';
            $trainingNames[$tn] = ($trainingNames[$tn] ?? 0) + 1;

            if ($t->instructor) {
                $instructors[$t->instructor] = ($instructors[$t->instructor] ?? 0) + 1;
            }
            if ($t->venue) {
                $locations[$t->venue] = ($locations[$t->venue] ?? 0) + 1;
            }
        }

        $participantsCountTrend = [];
        foreach ($participantsTrend as $my => $pArr) {
            $participantsCountTrend[$my] = count($pArr);
        }
        ksort($trend);
        ksort($participantsCountTrend);

        $participantDemographics = [];

        foreach ($trainings as $t) {
            $reg = $t->region ?? 'Unknown';
            $hoursByRegion[$reg] = ($hoursByRegion[$reg] ?? 0) + $t->hours;

            $grp = $t->group ?? 'Unknown';
            $hoursByGroup[$grp] = ($hoursByGroup[$grp] ?? 0) + $t->hours;

            $dept = $t->department ?? 'Unknown';
            $hoursByDept[$dept] = ($hoursByDept[$dept] ?? 0) + $t->hours;

            $gol = $t->grade ?? 'Unknown';
            $hoursByGol[$gol] = ($hoursByGol[$gol] ?? 0) + $t->hours;

            $lvlCategory = $t->level ?? 'Unknown';
            $hoursByLevel[$lvlCategory] = ($hoursByLevel[$lvlCategory] ?? 0) + $t->hours;

            $uniqueKey = $t->employee_id ?: ($t->nik_raw ?: $t->participant_name);
            if ($uniqueKey && ! isset($participantDemographics[$uniqueKey])) {
                $participantDemographics[$uniqueKey] = [
                    'gender' => $t->gender ?? 'Male',
                    'level' => $lvlCategory,
                ];
            }
        }

        $genderByLevel = [];
        foreach ($participantDemographics as $demo) {
            $lvl = $demo['level'];
            if (! isset($genderByLevel[$lvl])) {
                $genderByLevel[$lvl] = ['Male' => 0, 'Female' => 0];
            }
            $g = $demo['gender'] === 'Female' ? 'Female' : 'Male';
            $genderByLevel[$lvl][$g] += 1;
        }

        return [
            'kpi' => [
                'total_rows' => $totalRows,
                'unique_participants' => count($uniqueParticipants),
                'total_hours' => round($totalHours, 1),
                'avg_hours_per_participant' => count($uniqueParticipants) > 0 ? round($totalHours / count($uniqueParticipants), 1) : 0,
                'total_days' => round($totalDays, 1),
                'unique_trainings' => count($uniqueTrainings),
                'unlinked_rows' => $unlinkedRows,
            ],
            'trend' => [
                'hours' => $trend,
                'participants' => $participantsCountTrend,
            ],
            'donuts' => [
                'regularity' => $regularity,
                'source_type' => $sourceType,
            ],
            'top' => [
                'training_names' => $trainingNames,
                'instructors' => $instructors,
                'locations' => $locations,
            ],
            'hours_by' => [
                'region' => $hoursByRegion,
                'group' => $hoursByGroup,
                'dept' => $hoursByDept,
                'gol' => $hoursByGol,
                'level' => $hoursByLevel,
            ],
            'gender_by_level' => $genderByLevel,
        ];
    }

    private function emptyMetrics()
    {
        return [
            'kpi' => [
                'total_rows' => 0, 'unique_participants' => 0, 'total_hours' => 0,
                'avg_hours_per_participant' => 0, 'total_days' => 0, 'unique_trainings' => 0, 'unlinked_rows' => 0,
            ],
            'trend' => ['hours' => [], 'participants' => []],
            'donuts' => ['regularity' => [], 'source_type' => []],
            'top' => ['training_names' => [], 'instructors' => [], 'locations' => []],
            'hours_by' => ['region' => [], 'group' => [], 'dept' => [], 'gol' => [], 'level' => []],
            'gender_by_level' => [],
        ];
    }
}
