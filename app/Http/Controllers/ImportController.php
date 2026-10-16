<?php

namespace App\Http\Controllers;

use App\Exports\EmployeeTemplateExport;
use App\Exports\TrainingTemplateExport;
use App\Models\ImportBatch;
use App\Services\AuditLogger;
use App\Services\Import\EmployeeImporter;
use App\Services\Import\TrainingImporter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ImportController extends Controller
{
    public function index()
    {
        $batches = ImportBatch::latest()->take(50)->get();

        return Inertia::render('Admin/Import', [
            'batches' => $batches,
            'portalSyncConfig' => [
                'enabled' => (bool) config('services.portal.sync_enabled'),
                'time' => config('services.portal.sync_time', '02:00'),
            ],
            'counts' => [
                'employee' => DB::table('employees')->count(),
                'training' => DB::table('training_records')->count(),
            ],
        ]);
    }

    public function store(Request $request, EmployeeImporter $empImporter, TrainingImporter $trainImporter)
    {
        $request->validate([
            'type' => 'required|in:employee,training',
            'file' => 'required|file|mimes:csv,txt,xlsx,xls',
            'replace_all' => 'nullable|boolean',
        ], [
            'type.required' => 'Kategori data harus dipilih.',
            'type.in' => 'Kategori data tidak valid.',
            'file.required' => 'Berkas harus dipilih.',
            'file.file' => 'Berkas tidak valid.',
            'file.mimes' => 'Format berkas harus .xlsx, .xls, atau .csv.',
        ]);

        $file = $request->file('file');
        $type = $request->input('type');
        $replaceAll = $request->boolean('replace_all', false);

        try {
            if ($type === 'employee') {
                $empImporter->import($file, $request->user()->id, $replaceAll);
            } else {
                $trainImporter->import($file, $request->user()->id);
            }
            Cache::flush();
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Import gagal: '.$e->getMessage()]);
        }

        $msg = ($type === 'employee' && $replaceAll)
            ? 'Import data karyawan berhasil (data lama telah dibersihkan).'
            : 'Import berhasil dijalankan.';

        return back()->with('success', $msg);
    }

    public function syncPortal(Request $request, TrainingImporter $importer)
    {
        $dryRun = $request->boolean('dry_run', false);

        try {
            $batch = $importer->importFromPortal($request->user()?->id, $dryRun);
            AuditLogger::log(
                $request->user()->id,
                'import.portal_sync',
                null,
                null,
                [
                    'dry_run' => $dryRun,
                    'rows_total' => $batch->rows_total,
                    'rows_imported' => $batch->rows_imported,
                ]
            );
            Cache::flush();
        } catch (\Throwable $e) {
            return back()->withErrors(['portal' => 'Sync Portal gagal: '.$e->getMessage()]);
        }

        $msg = $dryRun ? 'Dry-run sync portal berhasil.' : 'Sinkronisasi data training dari portal berhasil.';

        return back()->with('success', $msg);
    }

    public function reset(Request $request)
    {
        $request->validate([
            'target' => 'required|in:employee,training,all',
            'confirmation' => 'required|string',
        ], [
            'target.required' => 'Target data harus dipilih.',
            'target.in' => 'Target data tidak valid.',
            'confirmation.required' => 'Ketik kata "HAPUS" untuk mengonfirmasi penghapusan data.',
        ]);

        if (strtoupper(trim($request->input('confirmation'))) !== 'HAPUS') {
            return back()->withErrors(['confirmation' => 'Ketik "HAPUS" untuk mengonfirmasi penghapusan data.']);
        }

        $target = $request->input('target');
        $deletedCount = 0;

        try {
            DB::transaction(function () use ($target, $request, &$deletedCount) {
                $empCount = DB::table('employees')->count();
                $trainCount = DB::table('training_records')->count();

                if ($target === 'employee' || $target === 'all') {
                    DB::table('training_records')->whereNotNull('employee_id')->update(['employee_id' => null]);
                    Storage::disk('public')->deleteDirectory('employees/photos');
                    DB::table('employees')->delete();
                    $deletedCount += $empCount;
                }

                if ($target === 'training' || $target === 'all') {
                    DB::table('training_records')->delete();
                    $deletedCount += $trainCount;
                }

                $label = match ($target) {
                    'employee' => 'Reset / Pembersihan Data Karyawan',
                    'training' => 'Reset / Pembersihan Data Pelatihan',
                    'all' => 'Reset / Pembersihan Seluruh Data Master',
                };

                ImportBatch::create([
                    'user_id' => $request->user()->id,
                    'type' => $target === 'all' ? 'employee' : $target,
                    'filename' => $label,
                    'rows_total' => $deletedCount,
                    'rows_imported' => 0,
                    'rows_skipped' => $deletedCount,
                    'status' => 'completed',
                    'started_at' => now(),
                    'finished_at' => now(),
                ]);

                AuditLogger::log(
                    $request->user()->id,
                    'data.reset',
                    null,
                    null,
                    [
                        'target' => $target,
                        'deleted_employees' => ($target === 'employee' || $target === 'all') ? $empCount : 0,
                        'deleted_trainings' => ($target === 'training' || $target === 'all') ? $trainCount : 0,
                    ]
                );
            });

            Cache::flush();
        } catch (\Throwable $e) {
            return back()->withErrors(['reset' => 'Gagal menghapus data: '.$e->getMessage()]);
        }

        $messages = [
            'employee' => 'Seluruh data karyawan berhasil dihapus bersih ('.number_format($deletedCount, 0, ',', '.').' data dibersihkan). Database siap untuk diimpor ulang.',
            'training' => 'Seluruh data rekam pelatihan berhasil dikosongkan ('.number_format($deletedCount, 0, ',', '.').' data dibersihkan).',
            'all' => 'Seluruh data karyawan dan rekaman pelatihan berhasil dikosongkan ('.number_format($deletedCount, 0, ',', '.').' data dibersihkan).',
        ];

        return back()->with('success', $messages[$target] ?? 'Data berhasil direset.');
    }

    public function downloadTemplate(string $type)
    {
        if ($type === 'employee') {
            return Excel::download(new EmployeeTemplateExport, 'Template_Import_Karyawan.xlsx');
        }

        if ($type === 'training') {
            return Excel::download(new TrainingTemplateExport, 'Template_Import_Pelatihan.xlsx');
        }

        abort(404, 'Template tidak ditemukan.');
    }
}
