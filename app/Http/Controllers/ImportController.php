<?php

namespace App\Http\Controllers;

use App\Models\ImportBatch;
use App\Services\AuditLogger;
use App\Services\Import\EmployeeImporter;
use App\Services\Import\TrainingImporter;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ImportController extends Controller
{
    public function index()
    {
        $batches = ImportBatch::latest()->take(20)->get();

        return Inertia::render('Admin/Import', [
            'batches' => $batches,
            'portalSyncConfig' => [
                'enabled' => (bool) config('services.portal.sync_enabled'),
                'time' => config('services.portal.sync_time', '02:00'),
            ],
        ]);

    }

    public function store(Request $request, EmployeeImporter $empImporter, TrainingImporter $trainImporter)
    {
        $request->validate([
            'type' => 'required|in:employee,training',
            'file' => 'required|file|mimes:csv,txt,xlsx,xls',
        ]);

        $file = $request->file('file');
        $type = $request->input('type');

        try {
            if ($type === 'employee') {
                $empImporter->import($file, $request->user()->id);
            } else {
                $trainImporter->import($file, $request->user()->id);
            }
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Import gagal: '.$e->getMessage()]);
        }

        return back()->with('success', 'Import berhasil dijalankan.');
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
        } catch (\Throwable $e) {
            return back()->withErrors(['portal' => 'Sync Portal gagal: '.$e->getMessage()]);
        }

        $msg = $dryRun ? 'Dry-run sync portal berhasil.' : 'Sinkronisasi data training dari portal berhasil.';

        return back()->with('success', $msg);
    }
}
