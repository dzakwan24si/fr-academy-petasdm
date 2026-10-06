<?php

namespace App\Http\Controllers;

use App\Exports\EmployeesExport;
use App\Models\Employee;
use App\Services\AuditLogger;
use App\Support\Demographics;
use App\Support\EmployeeFilter;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class EmployeeDirectoryController extends Controller
{
    public function index(Request $request, EmployeeFilter $filter)
    {
        $query = Employee::with(['company', 'location']);
        $query = $filter->apply($query, $request);

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('employee_id', 'like', "%{$search}%")
                    ->orWhere('job_title_name', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortKey = $request->input('sort', 'name');
        $sortOrder = $request->input('order', 'asc');

        $allowedSorts = [
            'employee_id', 'name', 'company_name', 'organization_name',
            'job_title_name', 'job_level_code', 'employment_type',
        ];

        if ($sortKey === 'umur' || $sortKey === 'generasi') {
            $query->orderBy('birth_date', $sortOrder === 'asc' ? 'desc' : 'asc');
        } elseif ($sortKey === 'masa_kerja') {
            $query->orderBy('join_date', $sortOrder === 'asc' ? 'desc' : 'asc');
        } elseif ($sortKey === 'company_name') {
            $query->join('companies', 'employees.company_id', '=', 'companies.id')
                ->orderBy('companies.name', $sortOrder)
                ->select('employees.*');
        } elseif (in_array($sortKey, $allowedSorts)) {
            $query->orderBy($sortKey, $sortOrder);
        }

        $perPage = (int) $request->input('per_page', 25);
        if (! in_array($perPage, [25, 50, 100])) {
            $perPage = 25;
        }

        $employees = $query->paginate($perPage)->withQueryString();

        // Transform for display
        $employees->getCollection()->transform(function ($e) {
            return [
                'id' => $e->id,
                'employee_id' => $e->employee_id,
                'name' => $e->name,
                'company_name' => $e->company->name ?? '-',
                'location_name' => $e->location->name ?? '-',
                'department' => $e->organization_name ?? '-',
                'job_title' => $e->job_title_name ?? '-',
                'level' => $e->job_level_code ?? '-',
                'employment_type' => $e->employment_type ?? '-',
                'generasi' => Demographics::generation($e->birth_date ? Carbon::parse($e->birth_date)->year : null),
                'umur' => Demographics::age($e->birth_date ? Carbon::parse($e->birth_date) : null),
                'masa_kerja' => Demographics::los($e->join_date ? Carbon::parse($e->join_date) : null),

                // Add fields required by StaffDetailModal if needed
                'company_id' => $e->company_id,
                'region' => $e->region,
                'join_date' => $e->join_date,
                'birth_date' => $e->birth_date,
                'gender' => $e->gender,
                'marital_status' => $e->marital_status,
                'religion' => $e->religion,
                'ptkp_code' => $e->ptkp_code,
                'photo_url' => $e->photo_url,
            ];
        });

        return Inertia::render('Employees/Index', [
            'employees' => $employees,
            'filters' => $request->all(),
        ]);
    }

    public function export(Request $request, EmployeeFilter $filter)
    {
        // 5.000 max rows
        $query = Employee::with(['company', 'location']);
        $query = $filter->apply($query, $request);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('employee_id', 'like', "%{$search}%")
                    ->orWhere('job_title_name', 'like', "%{$search}%");
            });
        }

        $count = $query->count();
        if ($count > 5000) {
            return back()->with('error', 'Export gagal: Maksimal 5.000 baris per ekspor. Silakan persempit filter.');
        }

        // Log to AuditLogger
        AuditLogger::log(auth()->id() ?? 1, 'EXPORT_EMPLOYEES', null, null, ['count' => $count]);

        return Excel::download(new EmployeesExport($query), 'direktori_karyawan_'.now()->format('Ymd_His').'.xlsx');
    }

    public function uploadPhoto(Request $request, string $employee_id)
    {
        $employee = Employee::where('employee_id', $employee_id)->firstOrFail();

        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:3072',
        ]);

        if ($employee->photo_path && Storage::disk('public')->exists($employee->photo_path)) {
            Storage::disk('public')->delete($employee->photo_path);
        }

        $path = $request->file('photo')->store('employees/photos', 'public');
        $employee->update(['photo_path' => $path]);

        AuditLogger::log(
            $request->user()?->id ?? 1,
            'UPDATE_EMPLOYEE_PHOTO',
            Employee::class,
            $employee->id,
            ['employee_id' => $employee->employee_id]
        );

        return response()->json([
            'message' => 'Foto profil berhasil diperbarui.',
            'photo_url' => $employee->photo_url,
        ]);
    }

    public function deletePhoto(Request $request, string $employee_id)
    {
        $employee = Employee::where('employee_id', $employee_id)->firstOrFail();

        if ($employee->photo_path && Storage::disk('public')->exists($employee->photo_path)) {
            Storage::disk('public')->delete($employee->photo_path);
        }

        $employee->update(['photo_path' => null]);

        AuditLogger::log(
            $request->user()?->id ?? 1,
            'DELETE_EMPLOYEE_PHOTO',
            Employee::class,
            $employee->id,
            ['employee_id' => $employee->employee_id]
        );

        return response()->json([
            'message' => 'Foto profil berhasil dihapus.',
            'photo_url' => null,
        ]);
    }
}
