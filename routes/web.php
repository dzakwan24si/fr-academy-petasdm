<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\DataController;
use App\Http\Controllers\EmployeeDirectoryController;
use App\Http\Controllers\FilterOptionsController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ResignationController;
use App\Http\Controllers\TrainingRecordController;
use App\Models\Company;
use App\Models\User;
use App\Services\CombinedMetrics;
use App\Services\InsightBuilder;
use App\Services\ResignationMetrics;
use App\Services\TenureMetrics;
use App\Services\TrainingMetrics;
use App\Services\WorkforceMetrics;
use App\Support\Clean;
use App\Support\EmployeeFilter;
use App\Support\TrainingFilter;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect('/dashboard');
});

// Authentication routes
Route::middleware('guest')->group(function () {
    Route::get('/login', function () {
        return Inertia::render('Auth/Login', [
            'turnstileSiteKey' => config('services.turnstile.key'),
            'turnstileEnabled' => (bool) config('services.turnstile.enabled', true),
        ]);
    })->name('login');

    Route::post('/login', function (Request $request) {
        $rules = [
            'nik' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];

        $turnstileEnabled = (bool) config('services.turnstile.enabled', true) && ! app()->environment('testing');
        if ($turnstileEnabled) {
            $rules['turnstile_token'] = ['required', 'string'];
        }

        $credentials = $request->validate($rules, [
            'turnstile_token.required' => 'Harap selesaikan verifikasi keamanan (Cloudflare).',
        ]);

        if ($turnstileEnabled) {
            $http = Http::asForm()->timeout(10);
            if (app()->environment('local') || ! (bool) config('services.turnstile.verify_ssl', true)) {
                $http = $http->withoutVerifying();
            }

            try {
                $response = $http->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                    'secret' => config('services.turnstile.secret'),
                    'response' => $credentials['turnstile_token'],
                    'remoteip' => $request->ip(),
                ]);

                if (! $response->json('success')) {
                    return back()->withErrors([
                        'turnstile_token' => 'Verifikasi keamanan tidak valid atau kedaluwarsa. Silakan centang ulang.',
                    ]);
                }
            } catch (Throwable $e) {
                Log::warning('Turnstile verification failed to reach Cloudflare: '.$e->getMessage());

                return back()->withErrors([
                    'turnstile_token' => 'Gagal memverifikasi keamanan ke server Cloudflare. Silakan periksa koneksi internet atau coba beberapa saat lagi.',
                ]);
            }
        }

        $user = User::where('nik', $credentials['nik'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return back()->withErrors([
                'nik' => 'NIK atau kata sandi yang Anda masukkan tidak sesuai.',
            ]);
        }

        if (! $user->is_active) {
            return back()->withErrors([
                'nik' => 'Akun Anda telah dinonaktifkan. Silakan hubungi Administrator.',
            ]);
        }

        Auth::login($user, $request->boolean('remember'));
        $user->update(['last_login_at' => now()]);
        $request->session()->regenerate();

        return redirect()->intended('dashboard');
    });
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', function (Request $request) {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    })->name('logout');

    Route::get('/pengaturan', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/pengaturan/profil', [ProfileController::class, 'updateProfile'])->name('profile.update');
    Route::put('/pengaturan/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

    Route::get('/dashboard', function (Request $request, EmployeeFilter $filter) {
        $asOf = $request->input('as_of') ? Carbon::parse($request->input('as_of')) : Carbon::now();
        $metricsService = new WorkforceMetrics($asOf);
        $resignService = new ResignationMetrics;

        return Inertia::render('Dashboard', [
            'metrics' => Inertia::defer(fn () => $metricsService->getMetrics($request, $filter, $request->user())),
            'resign_summary' => Inertia::defer(function () use ($resignService, $request, $metricsService, $filter) {
                $metrics = $metricsService->getMetrics($request, $filter, $request->user());
                $totalHc = $metrics['raw_totals']['total_hc'] ?? 0;

                return $resignService->getSummary($request, $totalHc);
            }),
            'insight' => Inertia::defer(function () use ($metricsService, $request, $filter) {
                $metrics = $metricsService->getMetrics($request, $filter, $request->user());

                return InsightBuilder::build($metrics['raw_totals'], $metrics['avg_age'], $metrics['raw_totals']['total_hc']);
            }),
            'filters' => $request->all(),
        ]);
    })->name('dashboard');

    // Resignation & Turnover Management
    Route::get('/resign', [ResignationController::class, 'index'])->name('resign.index');
    Route::get('/resign/template', [ResignationController::class, 'template'])->name('resign.template');
    Route::post('/resign/import', [ResignationController::class, 'import'])->name('resign.import');
    Route::get('/resign/export', [ResignationController::class, 'export'])->name('resign.export');
    Route::post('/resign', [ResignationController::class, 'store'])->name('resign.store');
    Route::put('/resign/{staffResign}', [ResignationController::class, 'update'])->name('resign.update');
    Route::delete('/resign/{staffResign}', [ResignationController::class, 'destroy'])->name('resign.destroy');

    // /peta redirect ke /perusahaan (URL lama tetap berfungsi)
    Route::get('/peta', function () {
        return redirect('/perusahaan', 301);
    })->name('peta');

    Route::get('/perusahaan', function () {
        return Inertia::render('Company/Index');
    })->name('perusahaan');

    Route::get('/perusahaan/{code}', function (string $code) {
        $company = Company::where('code', $code)->first();
        if (! $company) {
            $split = Company::where('code', $code.'-1')->first();
            if ($split) {
                return redirect()->route('perusahaan.show', ['code' => $code.'-1']);
            }
            abort(404);
        }

        $meta = Clean::companyMeta($company->name);

        return Inertia::render('Company/Show', [
            'companyCode' => $company->code,
            'companyId' => $company->id,
            'initialCompany' => [
                'id' => $company->id,
                'code' => $company->code,
                'name' => $company->name,
                'region' => $company->region,
                'group' => $company->group,
                'initials' => $meta['initials'],
                'aliases' => $meta['aliases'],
            ],
        ]);
    })->name('perusahaan.show');

    Route::get('/demografi', function (Request $request, EmployeeFilter $filter) {
        $asOf = $request->input('as_of') ? Carbon::parse($request->input('as_of')) : Carbon::now();
        $metricsService = new WorkforceMetrics($asOf);

        return Inertia::render('Demographics', [
            'metrics' => Inertia::defer(fn () => $metricsService->getMetrics($request, $filter, $request->user())),
            'filters' => $request->all(),
        ]);
    })->name('demografi');

    Route::get('/masa-kerja', function (Request $request, EmployeeFilter $filter) {
        $metricsService = new TenureMetrics;

        return Inertia::render('Tenure', [
            'metrics' => Inertia::defer(fn () => $metricsService->getMetrics($request, $filter)),
            'filters' => $request->all(),
        ]);
    })->name('masa-kerja');

    Route::get('/pensiun', function () {
        return redirect()->route('dashboard');
    })->name('pensiun');

    Route::get('/pelatihan', function (Request $request, TrainingFilter $filter) {
        $metricsService = new TrainingMetrics;

        return Inertia::render('Training', [
            'metrics' => Inertia::defer(fn () => $metricsService->getMetrics($request, $filter, $request->user())),
            'filters' => $request->all(),
        ]);
    })->name('pelatihan');

    Route::get('/pelatihan/data', [TrainingRecordController::class, 'index'])->name('pelatihan.data');
    Route::get('/pelatihan/data/export', [TrainingRecordController::class, 'export'])->name('pelatihan.data.export');

    Route::get('/analisis-gabungan', function (Request $request, EmployeeFilter $filter) {
        $metricsService = new CombinedMetrics;

        return Inertia::render('Combined', [
            'metrics' => Inertia::defer(fn () => $metricsService->getMetrics($request, $filter)),
            'filters' => $request->all(),
        ]);
    })->name('analisis-gabungan');

    // Karyawan route
    Route::get('/karyawan', [EmployeeDirectoryController::class, 'index'])->name('karyawan');
    Route::get('/karyawan/export', [EmployeeDirectoryController::class, 'export'])->name('karyawan.export');
    Route::post('/karyawan/{employee}/photo', [EmployeeDirectoryController::class, 'uploadPhoto'])->name('karyawan.photo.upload');
    Route::delete('/karyawan/{employee}/photo', [EmployeeDirectoryController::class, 'deletePhoto'])->name('karyawan.photo.delete');

    // Admin routes - Import & Sinkronisasi (Superadmin & Manajemen)
    Route::middleware('role:superadmin,manajemen')->group(function () {
        Route::get('/admin/import', [ImportController::class, 'index'])->name('admin.import');
        Route::get('/admin/import/template/{type}', [ImportController::class, 'downloadTemplate'])->name('admin.import.template');
        Route::post('/admin/import', [ImportController::class, 'store'])->name('admin.import.store');
        Route::post('/admin/import/portal-sync', [ImportController::class, 'syncPortal'])->middleware('throttle:3,1')->name('admin.import.portal-sync');
        Route::post('/admin/import/reset', [ImportController::class, 'reset'])->name('admin.import.reset');
    });

    // Admin routes - Manajemen Pengguna (Superadmin Only)
    Route::middleware('role:superadmin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/search-employee', [UserController::class, 'searchEmployee'])->name('users.search-employee');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}/role', [UserController::class, 'updateRole'])->name('users.update-role');
        Route::put('/users/{user}/password', [UserController::class, 'resetPassword'])->name('users.reset-password');
        Route::patch('/users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle-status');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });

    Route::redirect('/admin/kualitas-data', '/dashboard');
    Route::redirect('/admin/quality', '/dashboard');
    // /admin/lokasi dihapus — Master Lokasi tidak ada lagi

    // Endpoint JSON
    Route::prefix('data')->name('data.')->group(function () {
        Route::get('/map/locations', [DataController::class, 'locations'])->name('locations');
        Route::get('/companies', [DataController::class, 'companies'])->name('companies');
        Route::get('/companies/{company}/profile', [DataController::class, 'companyProfile'])->name('companies.profile');
        Route::get('/companies/{company}/employees', [DataController::class, 'companyEmployees'])->name('companies.employees');
        Route::get('/cohort/{year}/employees', [DataController::class, 'cohortEmployees'])->name('cohort.employees');
        Route::get('/employees/{employee}', [DataController::class, 'employeeDetail'])->name('employees.detail');
        Route::get('/trainings', [DataController::class, 'trainings'])->name('trainings');
        Route::get('/filter-options', [FilterOptionsController::class, 'index'])->name('filter-options');
    });
});
