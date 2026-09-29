<?php

namespace App\Services;

use App\Models\ImportBatch;
use App\Support\TrainingFilter;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class TrainingMetrics
{
    public function getMetrics(\Illuminate\Http\Request $request, TrainingFilter $filter, \App\Models\User $user)
    {
        $latestBatch = ImportBatch::latest('id')->first();
        $batchId = $latestBatch ? $latestBatch->id : 0;
        
        $filterHash = md5(json_encode($request->all()) . '_' . $user->id);
        $cacheKey = "training_metrics_{$batchId}_{$filterHash}";

        return Cache::remember($cacheKey, 3600, function () use ($request, $filter) {
            return $this->calculate($request, $filter);
        });
    }

    protected function calculate(\Illuminate\Http\Request $request, TrainingFilter $filter)
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
                $my = $t->year . '-' . str_pad($t->month, 2, '0', STR_PAD_LEFT);
                $trend[$my] = ($trend[$my] ?? 0) + $t->hours;
                
                if (!isset($participantsTrend[$my])) $participantsTrend[$my] = [];
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

        // Fetch employee details to calculate demographics hours
        // We only need employee details for records that have employee_id
        $empIds = array_keys($uniqueParticipants);
        $employees = [];
        if (!empty($empIds)) {
            $empData = DB::table('employees')->whereIn('employee_id', $empIds)->get([
                'employee_id', 'region', 'group', 'organization_name', 'gender', 'job_level_code'
            ]);
            foreach ($empData as $e) {
                $employees[$e->employee_id] = $e;
            }
        }

        // Second pass for employee specific aggregations
        foreach ($trainings as $t) {
            if ($t->employee_id && isset($employees[$t->employee_id])) {
                $e = $employees[$t->employee_id];
                
                $reg = $e->region ?? 'Unknown';
                $hoursByRegion[$reg] = ($hoursByRegion[$reg] ?? 0) + $t->hours;
                
                $grp = $e->group ?? 'Unknown';
                $hoursByGroup[$grp] = ($hoursByGroup[$grp] ?? 0) + $t->hours;
                
                $dept = $e->organization_name ?? 'Unknown';
                $hoursByDept[$dept] = ($hoursByDept[$dept] ?? 0) + $t->hours;
                
                // GOL Staf/Non Staf: Let's assume A,B,C,D is Staf? PRD didn't define Golongan mapping strictly for Training. Wait, job_level_code 1,2,3,4,5 vs A,B,C,D,E,F. 
                // Let's use simple logic: if level is A-F -> Non Staf (Workers?), 1-3 Staf, 4-5 Manager. 
                // Wait, typically Non Staf = A-F, Staf = 1-2, Middle = 3, Senior = 4-5.
                $isStaf = preg_match('/^[1-5]$/', $e->job_level_code) ? 'Staf' : 'Non Staf';
                $hoursByGol[$isStaf] = ($hoursByGol[$isStaf] ?? 0) + $t->hours;
                
                $lvlCategory = match(true) {
                    in_array($e->job_level_code, ['A','B','C','D','E','F']) => 'Workers',
                    in_array($e->job_level_code, ['1','2']) => 'Staf',
                    in_array($e->job_level_code, ['3']) => 'Middle',
                    in_array($e->job_level_code, ['4','5']) => 'Senior',
                    default => 'Unknown'
                };
                $hoursByLevel[$lvlCategory] = ($hoursByLevel[$lvlCategory] ?? 0) + $t->hours;
                
                if (!isset($genderByLevel[$lvlCategory])) {
                    $genderByLevel[$lvlCategory] = ['Male' => 0, 'Female' => 0];
                }
                $genderByLevel[$lvlCategory][$e->gender ?? 'Male'] += 1; // Wait, stacked bar gender x Level is Participant Count or Hours? "Stacked bar gender × Level" -> probably participant count. Let's use participant count.
            }
        }
        
        // Let's fix genderByLevel to be based on unique participants, not training records
        $genderByLevel = [];
        foreach ($empIds as $eid) {
            if (isset($employees[$eid])) {
                $e = $employees[$eid];
                $lvlCategory = match(true) {
                    in_array($e->job_level_code, ['A','B','C','D','E','F']) => 'Workers',
                    in_array($e->job_level_code, ['1','2']) => 'Staf',
                    in_array($e->job_level_code, ['3']) => 'Middle',
                    in_array($e->job_level_code, ['4','5']) => 'Senior',
                    default => 'Unknown'
                };
                if (!isset($genderByLevel[$lvlCategory])) {
                    $genderByLevel[$lvlCategory] = ['Male' => 0, 'Female' => 0];
                }
                $genderByLevel[$lvlCategory][$e->gender ?? 'Male'] += 1;
            }
        }

        return [
            'kpi' => [
                'total_rows' => $totalRows,
                'unique_participants' => count($uniqueParticipants),
                'total_hours' => round($totalHours, 1),
                'avg_hours_per_participant' => count($uniqueParticipants) > 0 ? round($totalHours / count($uniqueParticipants), 1) : 0,
                'total_days' => round($totalDays, 1),
                'unique_trainings' => count($uniqueTrainings),
                'unlinked_rows' => $unlinkedRows
            ],
            'trend' => [
                'hours' => $trend,
                'participants' => $participantsCountTrend
            ],
            'donuts' => [
                'regularity' => $regularity,
                'source_type' => $sourceType
            ],
            'top' => [
                'training_names' => $trainingNames,
                'instructors' => $instructors,
                'locations' => $locations
            ],
            'hours_by' => [
                'region' => $hoursByRegion,
                'group' => $hoursByGroup,
                'dept' => $hoursByDept,
                'gol' => $hoursByGol,
                'level' => $hoursByLevel
            ],
            'gender_by_level' => $genderByLevel
        ];
    }

    private function emptyMetrics()
    {
        return [
            'kpi' => [
                'total_rows' => 0, 'unique_participants' => 0, 'total_hours' => 0,
                'avg_hours_per_participant' => 0, 'total_days' => 0, 'unique_trainings' => 0, 'unlinked_rows' => 0
            ],
            'trend' => ['hours' => [], 'participants' => []],
            'donuts' => ['regularity' => [], 'source_type' => []],
            'top' => ['training_names' => [], 'instructors' => [], 'locations' => []],
            'hours_by' => ['region' => [], 'group' => [], 'dept' => [], 'gol' => [], 'level' => []],
            'gender_by_level' => []
        ];
    }
}
