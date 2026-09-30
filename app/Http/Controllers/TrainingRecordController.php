<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\TrainingRecord;
use App\Support\TrainingFilter;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\TrainingRecordsExport;

class TrainingRecordController extends Controller
{
    public function index(Request $request, TrainingFilter $filter)
    {
        $query = TrainingRecord::with(['employee', 'company']);
        $query = $filter->apply($query, $request);

        // Filter NIK Status
        if ($nikStatus = $request->input('nik_status')) {
            if ($nikStatus === 'terhubung') {
                $query->whereNotNull('employee_id');
            } elseif ($nikStatus === 'tidak_terhubung') {
                $query->whereNull('employee_id');
            } elseif (in_array($nikStatus, ['kosong', 'rusak', 'tidak_valid'])) {
                if ($nikStatus === 'kosong') {
                    $query->where('nik_status', 'empty');
                } elseif ($nikStatus === 'rusak') {
                    $query->where('nik_status', 'corrupt');
                } elseif ($nikStatus === 'tidak_valid') {
                    $query->where('nik_status', 'not_found');
                }
            }
        }

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('participant_name', 'like', "%{$search}%")
                  ->orWhere('nik', 'like', "%{$search}%")
                  ->orWhere('nik_raw', 'like', "%{$search}%")
                  ->orWhere('training_name', 'like', "%{$search}%")
                  ->orWhere('company_name_raw', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortKey = $request->input('sort', 'participant_name');
        $sortOrder = $request->input('order', 'asc');
        
        $allowedSorts = [
            'nik', 'participant_name', 'company_name_raw', 'department', 
            'work_location', 'group', 'region', 'grade', 'position',
            'month', 'year', 'days', 'hours', 'training_name',
            'instructor', 'venue', 'regularity', 'source_type', 'level'
        ];
        
        if (in_array($sortKey, $allowedSorts)) {
            $query->orderBy($sortKey, $sortOrder);
        } else {
            $query->orderBy('id', 'desc');
        }

        $perPage = (int) $request->input('per_page', 25);
        if (!in_array($perPage, [25, 50, 100])) {
            $perPage = 25;
        }

        $records = $query->paginate($perPage)->withQueryString();

        // Transform for display
        $records->getCollection()->transform(function ($t) {
            return [
                'id' => $t->id,
                'employee_id' => $t->employee_id,
                'nik' => $t->nik_status === 'ok' ? $t->nik : $t->nik_raw,
                'nik_status' => $t->nik_status,
                'participant_name' => $t->participant_name,
                'pt_name' => $t->company_name_raw,
                'company_alias' => $t->company->name ?? '-',
                'department' => $t->department,
                'work_location' => $t->work_location,
                'group' => $t->group,
                'region' => $t->region,
                'job_category' => $t->grade,
                'job_position' => $t->position,
                'period_month' => $t->month,
                'period_year' => $t->year,
                'days' => $t->days,
                'hours' => $t->hours,
                'training_name' => $t->training_name,
                'instructor' => $t->instructor,
                'place' => $t->venue,
                'is_regular' => $t->regularity === 'Reguler' || $t->regularity == 1,
                'is_internal' => $t->source_type === 'Internal' || $t->source_type == 1,
                'level' => $t->level,
                
                // Fields for employee modal if linked
                'employee' => $t->employee_id ? [
                    'id' => $t->employee->id ?? null,
                    'employee_id' => $t->employee->employee_id ?? null,
                    'name' => $t->employee->name ?? null,
                    'company_name' => $t->employee->company->name ?? null,
                    'location_name' => $t->employee->location->name ?? null,
                    'department' => $t->employee->organization_name ?? null,
                    'job_title' => $t->employee->job_title_name ?? null,
                    'level' => $t->employee->job_level_code ?? null,
                    'employment_type' => $t->employee->employment_type ?? null,
                    'company_id' => $t->employee->company_id ?? null,
                    'region' => $t->employee->region ?? null,
                    'join_date' => $t->employee->join_date ?? null,
                    'birth_date' => $t->employee->birth_date ?? null,
                    'gender' => $t->employee->gender ?? null,
                    'marital_status' => $t->employee->marital_status ?? null,
                    'religion' => $t->employee->religion ?? null,
                    'ptkp_code' => $t->employee->ptkp_code ?? null,
                ] : null,
            ];
        });

        return Inertia::render('Training/Data', [
            'records' => $records,
            'filters' => $request->all(),
        ]);
    }
    
    public function export(Request $request, TrainingFilter $filter)
    {
        // 5.000 max rows
        $query = TrainingRecord::with(['company']);
        $query = $filter->apply($query, $request);
        
        // Filter NIK Status
        if ($nikStatus = $request->input('nik_status')) {
            if ($nikStatus === 'terhubung') {
                $query->whereNotNull('employee_id');
            } elseif ($nikStatus === 'tidak_terhubung') {
                $query->whereNull('employee_id');
            } elseif (in_array($nikStatus, ['kosong', 'rusak', 'tidak_valid'])) {
                if ($nikStatus === 'kosong') {
                    $query->where('nik_status', 'empty');
                } elseif ($nikStatus === 'rusak') {
                    $query->where('nik_status', 'corrupt');
                } elseif ($nikStatus === 'tidak_valid') {
                    $query->where('nik_status', 'not_found');
                }
            }
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('participant_name', 'like', "%{$search}%")
                  ->orWhere('nik', 'like', "%{$search}%")
                  ->orWhere('nik_raw', 'like', "%{$search}%")
                  ->orWhere('training_name', 'like', "%{$search}%")
                  ->orWhere('pt_name', 'like', "%{$search}%");
            });
        }
        
        $count = $query->count();
        if ($count > 5000) {
            return back()->with('error', 'Export gagal: Maksimal 5.000 baris per ekspor. Silakan persempit filter.');
        }
        
        // Log to AuditLogger
        \App\Services\AuditLogger::log(auth()->id() ?? 1, 'EXPORT_TRAINING_RECORDS', null, null, ['count' => $count]);

        return Excel::download(new TrainingRecordsExport($query), 'data_training_' . date('Ymd_His') . '.xlsx');
    }
}
