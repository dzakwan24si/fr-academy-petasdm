<?php

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

    Route::post('/login', function (\Illuminate\Http\Request $request) {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (\Illuminate\Support\Facades\Auth::attempt($credentials)) {
            $request->session()->regenerate();
            return redirect()->intended('dashboard');
        }

        return back()->withErrors([
            'email' => 'Email atau password salah.',
        ]);
    });
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', function (\Illuminate\Http\Request $request) {
        \Illuminate\Support\Facades\Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/login');
    })->name('logout');

    Route::get('/dashboard', function (\Illuminate\Http\Request $request, \App\Support\EmployeeFilter $filter) {
        $metricsService = new \App\Services\WorkforceMetrics(\Carbon\Carbon::parse('2026-09-28'));
        
        return Inertia::render('Dashboard', [
            'metrics' => Inertia::defer(fn () => $metricsService->getMetrics($request, $filter, $request->user())),
            'insight' => Inertia::defer(function () use ($metricsService, $request, $filter) {
                $metrics = $metricsService->getMetrics($request, $filter, $request->user());
                return \App\Services\InsightBuilder::build($metrics['raw_totals'], $metrics['avg_age'], $metrics['raw_totals']['total_hc']);
            }),
            'filters' => $request->all()
        ]);
    })->name('dashboard');

    Route::get('/peta', function () {
        return Inertia::render('Map/Index');
    })->name('peta');

    Route::get('/demografi', function (\Illuminate\Http\Request $request, \App\Support\EmployeeFilter $filter) {
        $metricsService = new \App\Services\WorkforceMetrics(\Carbon\Carbon::parse('2026-09-28'));
        
        return Inertia::render('Demographics', [
            'metrics' => Inertia::defer(fn () => $metricsService->getMetrics($request, $filter, $request->user())),
            'filters' => $request->all()
        ]);
    })->name('demografi');

    Route::get('/masa-kerja', function () {
        return Inertia::render('Tenure');
    })->name('masa-kerja');

    Route::get('/pensiun', function () {
        return Inertia::render('Retirement');
    })->name('pensiun');

    Route::get('/pelatihan', function (\Illuminate\Http\Request $request, \App\Support\TrainingFilter $filter) {
        $metricsService = new \App\Services\TrainingMetrics();
        return Inertia::render('Training', [
            'metrics' => Inertia::defer(fn () => $metricsService->getMetrics($request, $filter, $request->user())),
            'filters' => $request->all()
        ]);
    })->name('pelatihan');

    Route::get('/analisis-gabungan', function () {
        return Inertia::render('Combined');
    })->name('analisis-gabungan');

    // Karyawan route
    Route::get('/karyawan', function () {
        return Inertia::render('Employees/Index');
    })->name('karyawan');

    // Admin routes
    Route::get('/admin/import', [\App\Http\Controllers\ImportController::class, 'index'])->name('admin.import');
    Route::post('/admin/import', [\App\Http\Controllers\ImportController::class, 'store'])->name('admin.import.store');
    
    Route::get('/admin/kualitas-data', [\App\Http\Controllers\DataQualityController::class, 'index'])->name('admin.kualitas');
    Route::get('/admin/lokasi', [\App\Http\Controllers\LocationController::class, 'index'])->name('admin.lokasi');
    Route::post('/admin/lokasi/{location}', [\App\Http\Controllers\LocationController::class, 'update'])->name('admin.lokasi.update');
    Route::post('/admin/lokasi-import', [\App\Http\Controllers\LocationController::class, 'import'])->name('admin.lokasi.import');

    // Endpoint JSON
    Route::prefix('data')->name('data.')->group(function () {
        Route::get('/map/locations', [\App\Http\Controllers\DataController::class, 'locations'])->name('locations');
        Route::get('/companies', [\App\Http\Controllers\DataController::class, 'companies'])->name('companies');
        Route::get('/companies/{company}/profile', [\App\Http\Controllers\DataController::class, 'companyProfile'])->name('companies.profile');
        Route::get('/companies/{company}/employees', [\App\Http\Controllers\DataController::class, 'companyEmployees'])->name('companies.employees');
        Route::get('/employees/{employee}', [\App\Http\Controllers\DataController::class, 'employeeDetail'])->name('employees.detail');
        Route::get('/trainings', [\App\Http\Controllers\DataController::class, 'trainings'])->name('trainings');
        Route::get('/filter-options', [\App\Http\Controllers\FilterOptionsController::class, 'index'])->name('filter-options');
    });
});
