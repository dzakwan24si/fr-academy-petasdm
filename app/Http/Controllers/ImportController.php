<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ImportBatch;
use App\Services\Import\EmployeeImporter;
use App\Services\Import\TrainingImporter;
use Illuminate\Support\Facades\DB;

class ImportController extends Controller
{
    public function index()
    {
        $batches = ImportBatch::latest()->take(20)->get();
        return Inertia::render('Admin/Import', [
            'batches' => $batches
        ]);
    }

    public function store(Request $request, EmployeeImporter $empImporter, TrainingImporter $trainImporter)
    {
        $request->validate([
            'type' => 'required|in:employee,training',
            'file' => 'required|file|mimes:csv,txt'
        ]);

        $path = $request->file('file')->getRealPath();
        $type = $request->input('type');

        try {
            if ($type === 'employee') {
                $empImporter->import($path, $request->user()->id);
            } else {
                $trainImporter->import($path, $request->user()->id);
            }
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Import gagal: ' . $e->getMessage()]);
        }

        return back()->with('success', 'Import berhasil dijalankan.');
    }
}
