<?php

use App\Http\Controllers\DataController;
use App\Http\Controllers\DataQualityController;
use App\Http\Controllers\EmployeeDirectoryController;
use App\Http\Controllers\FilterOptionsController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TrainingRecordController;
use App\Models\Company;
use App\Services\CombinedMetrics;
use App\Services\InsightBuilder;
use App\Services\RetirementMetrics;
use App\Services\TenureMetrics;
use App\Services\TrainingMetrics;
use App\Services\WorkforceMetrics;
use App\Support\EmployeeFilter;
use App\Support\TrainingFilter;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect('/dashboard');
});

// Since we skipped Breeze, we create a very simple login placeholder for Phase 0
Route::middleware('guest')->group(function () {
    Route::get('/login', function () {
        return Inertia::render('Auth/Login');
    })->name('login');

    Route::post('/login', function (Request $request) {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            return redirect()->intended('dashboard');
        }

        return back()->withErrors([
            'email' => 'Email atau password salah.',
        ]);
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

        return Inertia::render('Dashboard', [
            'metrics' => Inertia::defer(fn () => $metricsService->getMetrics($request, $filter, $request->user())),
            'insight' => Inertia::defer(function () use ($metricsService, $request, $filter) {
                $metrics = $metricsService->getMetrics($request, $filter, $request->user());

                return InsightBuilder::build($metrics['raw_totals'], $metrics['avg_age'], $metrics['raw_totals']['total_hc']);
            }),
            'filters' => $request->all(),
        ]);
    })->name('dashboard');

    // /peta redirect ke /perusahaan (URL lama tetap berfungsi)
    Route::get('/peta', function () {
        return redirect('/perusahaan', 301);
    })->name('peta');

    Route::get('/perusahaan', function () {
        return Inertia::render('Company/Index');
    })->name('perusahaan');

    Route::get('/perusahaan/{code}', function (string $code) {
        $company = Company::where('code', $code)->firstOrFail();

        return Inertia::render('Company/Show', ['companyCode' => $code, 'companyId' => $company->id]);
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

    Route::get('/pensiun', function (Request $request, EmployeeFilter $filter) {
        $metricsService = new RetirementMetrics;

        return Inertia::render('Retirement', [
            'metrics' => Inertia::defer(fn () => $metricsService->getMetrics($request, $filter)),
            'filters' => $request->all(),
        ]);
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

    // Admin routes
    Route::get('/admin/import', [ImportController::class, 'index'])->name('admin.import');
    Route::post('/admin/import', [ImportController::class, 'store'])->name('admin.import.store');
    Route::post('/admin/import/portal-sync', [ImportController::class, 'syncPortal'])->middleware('throttle:3,1')->name('admin.import.portal-sync');

    Route::get('/admin/kualitas-data', [DataQualityController::class, 'index'])->name('admin.kualitas');
    Route::redirect('/admin/quality', '/admin/kualitas-data');
    // /admin/lokasi dihapus — Master Lokasi tidak ada lagi

    // Endpoint JSON
    Route::prefix('data')->name('data.')->group(function () {
        Route::get('/map/locations', [DataController::class, 'locations'])->name('locations');
        Route::get('/companies', [DataController::class, 'companies'])->name('companies');
        Route::get('/companies/{company}/profile', [DataController::class, 'companyProfile'])->name('companies.profile');
        Route::get('/companies/{company}/employees', [DataController::class, 'companyEmployees'])->name('companies.employees');
        Route::get('/employees/{employee}', [DataController::class, 'employeeDetail'])->name('employees.detail');
        Route::get('/trainings', [DataController::class, 'trainings'])->name('trainings');
        Route::get('/filter-options', [FilterOptionsController::class, 'index'])->name('filter-options');
    });
});
