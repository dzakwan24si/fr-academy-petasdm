<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Tampilkan daftar akun pengguna dengan filter dan statistik.
     */
    public function index(Request $request): Response
    {
        $query = User::query()
            ->with(['employee:employee_id,name,job_title_name,organization_name,region'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = trim((string) $request->input('search'));
                $q->where(function ($sub) use ($term) {
                    $sub->where('name', 'like', "%{$term}%")
                        ->orWhere('nik', 'like', "%{$term}%")
                        ->orWhere('job_title', 'like', "%{$term}%");
                });
            })
            ->when($request->filled('role'), function ($q) use ($request) {
                $q->where('role', $request->input('role'));
            })
            ->when($request->filled('status'), function ($q) use ($request) {
                $status = $request->input('status');
                if ($status === 'active') {
                    $q->where('is_active', true);
                } elseif ($status === 'inactive') {
                    $q->where('is_active', false);
                }
            })
            ->orderByRaw("CASE WHEN role = 'superadmin' THEN 1 WHEN role = 'manajemen' THEN 2 ELSE 3 END")
            ->orderBy('name');

        return Inertia::render('Admin/Users', [
            'users' => $query->paginate(15)->withQueryString(),
            'filters' => [
                'search' => (string) $request->input('search', ''),
                'role' => (string) $request->input('role', ''),
                'status' => (string) $request->input('status', ''),
            ],
            'stats' => [
                'total' => User::count(),
                'superadmin' => User::where('role', 'superadmin')->count(),
                'manajemen' => User::where('role', 'manajemen')->count(),
                'viewer' => User::where('role', 'viewer')->count(),
                'active' => User::where('is_active', true)->count(),
                'inactive' => User::where('is_active', false)->count(),
            ],
        ]);
    }

    /**
     * Endpoint live autocomplete pencarian karyawan berdasarkan NIK atau Nama.
     */
    public function searchEmployee(Request $request): JsonResponse
    {
        $term = trim((string) $request->input('q', ''));

        if (strlen($term) < 1) {
            return response()->json([]);
        }

        $existingNiks = User::whereNotNull('nik')->pluck('nik')->flip()->toArray();

        $employees = Employee::query()
            ->where(function ($sub) use ($term) {
                $sub->where('employee_id', 'like', "%{$term}%")
                    ->orWhere('name', 'like', "%{$term}%");
            })
            ->limit(10)
            ->get(['employee_id', 'name', 'job_title_name', 'organization_name', 'region'])
            ->map(function (Employee $emp) use ($existingNiks) {
                return [
                    'employee_id' => $emp->employee_id,
                    'name' => $emp->name,
                    'job_title_name' => $emp->job_title_name,
                    'organization_name' => $emp->organization_name,
                    'region' => $emp->region,
                    'already_registered' => isset($existingNiks[$emp->employee_id]),
                ];
            });

        return response()->json($employees);
    }

    /**
     * Daftarkan akun baru (dari data karyawan atau input manual akun Direksi).
     */
    public function store(Request $request): RedirectResponse
    {
        $isManual = $request->boolean('is_manual');

        if ($isManual) {
            $validated = $request->validate([
                'nik' => ['required', 'string', 'max:50', 'unique:users,nik'],
                'name' => ['required', 'string', 'max:255'],
                'job_title' => ['required', 'string', 'max:255'],
                'role' => ['required', 'string', Rule::in(['superadmin', 'manajemen', 'viewer'])],
                'password' => ['required', 'string', 'min:6'],
                'is_active' => ['nullable', 'boolean'],
            ], [
                'nik.required' => 'NIK atau ID Akun wajib diisi.',
                'nik.unique' => 'NIK / ID ini sudah terdaftar sebagai pengguna sistem.',
                'name.required' => 'Nama lengkap wajib diisi.',
                'job_title.required' => 'Jabatan wajib diisi.',
                'role.required' => 'Pilih role hak akses pengguna.',
                'role.in' => 'Role yang dipilih tidak valid.',
                'password.required' => 'Kata sandi wajib diisi.',
                'password.min' => 'Kata sandi minimal terdiri dari 6 karakter.',
            ]);

            User::create([
                'nik' => $validated['nik'],
                'name' => $validated['name'],
                'job_title' => $validated['job_title'],
                'role' => $validated['role'],
                'password' => Hash::make($validated['password']),
                'is_active' => $request->boolean('is_active', true),
            ]);

            return back()->with('success', "Akun Direksi / Khusus untuk {$validated['name']} ({$validated['nik']}) berhasil dibuat dengan jabatan {$validated['job_title']}.");
        }

        $validated = $request->validate([
            'nik' => ['required', 'string', 'max:50', 'unique:users,nik', 'exists:employees,employee_id'],
            'role' => ['required', 'string', Rule::in(['superadmin', 'manajemen', 'viewer'])],
            'password' => ['required', 'string', 'min:6'],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'nik.required' => 'NIK wajib diisi.',
            'nik.unique' => 'NIK ini sudah terdaftar sebagai pengguna sistem.',
            'nik.exists' => 'NIK tidak ditemukan pada master data karyawan.',
            'role.required' => 'Pilih role hak akses pengguna.',
            'role.in' => 'Role yang dipilih tidak valid.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.min' => 'Kata sandi minimal terdiri dari 6 karakter.',
        ]);

        $employee = Employee::where('employee_id', $validated['nik'])->first();
        $name = $employee ? $employee->name : $validated['nik'];
        $jobTitle = $employee ? $employee->job_title_name : null;

        User::create([
            'nik' => $validated['nik'],
            'name' => $name,
            'job_title' => $jobTitle,
            'role' => $validated['role'],
            'password' => Hash::make($validated['password']),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', "Akun untuk {$name} ({$validated['nik']}) berhasil dibuat dengan role ".ucfirst($validated['role']).'.');
    }

    /**
     * Perbarui role hak akses akun pengguna.
     */
    public function updateRole(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(['superadmin', 'manajemen', 'viewer'])],
        ], [
            'role.required' => 'Role wajib dipilih.',
            'role.in' => 'Pilihan role tidak valid.',
        ]);

        $currentUser = $request->user();

        if ($user->id === $currentUser->id && $validated['role'] !== 'superadmin') {
            return back()->with('error', 'Anda tidak dapat menurunkan role akun Anda sendiri.');
        }

        if ($user->isSuperAdmin() && $validated['role'] !== 'superadmin' && User::where('role', 'superadmin')->count() <= 1) {
            return back()->with('error', 'Tidak dapat mengubah role superadmin terakhir dalam sistem.');
        }

        $user->update(['role' => $validated['role']]);

        return back()->with('success', "Role akun {$user->name} berhasil diubah menjadi ".ucfirst($validated['role']).'.');
    }

    /**
     * Reset kata sandi pengguna.
     */
    public function resetPassword(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:6'],
        ], [
            'password.required' => 'Kata sandi baru wajib diisi.',
            'password.min' => 'Kata sandi minimal 6 karakter.',
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', "Kata sandi untuk akun {$user->name} ({$user->nik}) berhasil direset.");
    }

    /**
     * Aktifkan atau nonaktifkan akun pengguna.
     */
    public function toggleStatus(Request $request, User $user): RedirectResponse
    {
        $currentUser = $request->user();

        if ($user->id === $currentUser->id) {
            return back()->with('error', 'Anda tidak dapat menonaktifkan akun Anda sendiri.');
        }

        if ($user->isSuperAdmin() && $user->is_active && User::where('role', 'superadmin')->where('is_active', true)->count() <= 1) {
            return back()->with('error', 'Tidak dapat menonaktifkan satu-satunya akun Superadmin yang aktif.');
        }

        $newStatus = ! $user->is_active;
        $user->update(['is_active' => $newStatus]);

        $statusText = $newStatus ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Akun {$user->name} ({$user->nik}) berhasil {$statusText}.");
    }

    /**
     * Hapus akun pengguna dari sistem.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        $currentUser = $request->user();

        if ($user->id === $currentUser->id) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        if ($user->isSuperAdmin() && User::where('role', 'superadmin')->count() <= 1) {
            return back()->with('error', 'Tidak dapat menghapus superadmin terakhir dalam sistem.');
        }

        $userName = $user->name;
        $userNik = $user->nik;
        $user->delete();

        return back()->with('success', "Akun {$userName} ({$userNik}) berhasil dihapus dari sistem.");
    }
}
