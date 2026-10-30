<?php

namespace App\Http\Controllers;

use App\Exports\StaffResignTemplateExport;
use App\Models\StaffResign;
use App\Services\Import\StaffResignImporter;
use App\Services\ResignationMetrics;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ResignationController extends Controller
{
    public function index(Request $request, ResignationMetrics $metricsService)
    {
        $metrics = $metricsService->getMetrics($request);

        // Build Query for Employee Resignation Directory (Tab 2)
        $query = StaffResign::query();

        // Filter Year
        if ($year = $request->input('year')) {
            if ($year !== 'all') {
                $query->whereYear('resign_date', (int) $year);
            }
        }

        // Filter Region
        if ($rawRegion = $request->input('region')) {
            $regions = collect(Arr::flatten((array) $rawRegion))
                ->filter(fn ($r) => ! empty($r) && $r !== 'all')
                ->values()
                ->all();

            if (! empty($regions)) {
                $query->whereIn('region', $regions);
            }
        }

        // Filter Jenis Resign
        if ($jenis = $request->input('jenis_resign')) {
            if ($jenis !== 'all') {
                $query->where('jenis_resign', $jenis);
            }
        }

        // Filter Cluster Resign
        if ($cluster = $request->input('cluster_resign')) {
            if ($cluster !== 'all') {
                $query->where('cluster_resign', $cluster);
            }
        }

        // Filter Alumni
        if ($alumni = $request->input('alumni')) {
            if ($alumni !== 'all') {
                $query->where('alumni', $alumni);
            }
        }

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                    ->orWhere('employee_id', 'like', "%{$search}%")
                    ->orWhere('jabatan', 'like', "%{$search}%")
                    ->orWhere('kebun', 'like', "%{$search}%")
                    ->orWhere('deskripsi_resign', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortKey = $request->input('sort', 'resign_date');
        $sortOrder = $request->input('order', 'desc');
        $allowedSorts = ['resign_date', 'join_date', 'nama', 'employee_id', 'jabatan', 'kebun', 'region', 'jenis_resign', 'cluster_resign'];

        if (in_array($sortKey, $allowedSorts)) {
            $query->orderBy($sortKey, $sortOrder);
        } else {
            $query->orderBy('resign_date', 'desc');
        }

        $perPage = (int) $request->input('per_page', 15);
        if (! in_array($perPage, [10, 15, 25, 50, 100])) {
            $perPage = 15;
        }

        $paginated = $query->paginate($perPage)->withQueryString();

        // Transform collection to include formatted dates & tenure
        $paginated->getCollection()->transform(function ($item) {
            $join = $item->join_date ? Carbon::parse($item->join_date) : null;
            $resign = $item->resign_date ? Carbon::parse($item->resign_date) : null;

            $tenure = '-';
            if ($join && $resign) {
                $diff = $join->diff($resign);
                $parts = [];
                if ($diff->y > 0) {
                    $parts[] = "{$diff->y} thn";
                }
                if ($diff->m > 0 || empty($parts)) {
                    $parts[] = "{$diff->m} bln";
                }
                $tenure = implode(' ', $parts);
            }

            return [
                'id' => $item->id,
                'employee_id' => $item->employee_id ?: '-',
                'nama' => $item->nama,
                'join_date' => $item->join_date ? $item->join_date->format('d M Y') : '-',
                'resign_date' => $item->resign_date ? $item->resign_date->format('d M Y') : '-',
                'join_date_raw' => $item->join_date ? $item->join_date->format('Y-m-d') : '',
                'resign_date_raw' => $item->resign_date ? $item->resign_date->format('Y-m-d') : '',
                'tenure' => $tenure,
                'jabatan' => $item->jabatan,
                'kebun' => $item->kebun,
                'deskripsi_resign' => $item->deskripsi_resign ?: '-',
                'jenis_resign' => $item->jenis_resign,
                'cluster_resign' => $item->cluster_resign,
                'alumni' => $item->alumni,
                'keterangan' => $item->keterangan ?: '-',
                'region' => $item->region,
            ];
        });

        // Unique filter options (dynamically fetched from DB)
        $years = StaffResign::query()
            ->whereNotNull('resign_date')
            ->selectRaw('DISTINCT YEAR(resign_date) as yr')
            ->orderByDesc('yr')
            ->pluck('yr')
            ->map(fn ($y) => (int) $y)
            ->values()
            ->toArray();

        if (empty($years)) {
            $years = [(int) date('Y'), (int) date('Y') - 1];
        }

        $filterOptions = [
            'clusters' => StaffResign::query()->select('cluster_resign')->distinct()->pluck('cluster_resign')->filter()->values(),
            'jabatans' => StaffResign::query()->select('jabatan')->distinct()->pluck('jabatan')->filter()->values(),
            'regions' => ['Riau', 'Kalbar', 'Kaltim'],
            'years' => $years,
        ];

        return Inertia::render('Resignation/Index', [
            'metrics' => $metrics,
            'records' => $paginated,
            'filters' => $request->only(['year', 'region', 'jenis_resign', 'cluster_resign', 'alumni', 'search', 'sort', 'order', 'tab', 'per_page']),
            'filterOptions' => $filterOptions,
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => ['nullable', 'string', 'max:50'],
            'nama' => ['required', 'string', 'max:255'],
            'join_date' => ['nullable', 'date'],
            'resign_date' => ['required', 'date'],
            'jabatan' => ['required', 'string', 'max:100'],
            'kebun' => ['required', 'string', 'max:100'],
            'deskripsi_resign' => ['nullable', 'string'],
            'jenis_resign' => ['required', 'string', 'in:VOLUNTARY,INVOLUNTARY'],
            'cluster_resign' => ['required', 'string', 'max:100'],
            'alumni' => ['required', 'string', 'in:Alumni,Non Alumni'],
            'keterangan' => ['nullable', 'string', 'max:255'],
            'region' => ['required', 'string', 'in:Riau,Kalbar,Kaltim'],
        ]);

        StaffResign::create($validated);

        return back()->with('success', 'Data karyawan resign berhasil ditambahkan.');
    }

    public function update(Request $request, StaffResign $staffResign)
    {
        $validated = $request->validate([
            'employee_id' => ['nullable', 'string', 'max:50'],
            'nama' => ['required', 'string', 'max:255'],
            'join_date' => ['nullable', 'date'],
            'resign_date' => ['required', 'date'],
            'jabatan' => ['required', 'string', 'max:100'],
            'kebun' => ['required', 'string', 'max:100'],
            'deskripsi_resign' => ['nullable', 'string'],
            'jenis_resign' => ['required', 'string', 'in:VOLUNTARY,INVOLUNTARY'],
            'cluster_resign' => ['required', 'string', 'max:100'],
            'alumni' => ['required', 'string', 'in:Alumni,Non Alumni'],
            'keterangan' => ['nullable', 'string', 'max:255'],
            'region' => ['required', 'string', 'in:Riau,Kalbar,Kaltim'],
        ]);

        $staffResign->update($validated);

        return back()->with('success', 'Data karyawan resign berhasil diperbarui.');
    }

    public function destroy(StaffResign $staffResign)
    {
        $staffResign->delete();

        return back()->with('success', 'Data karyawan resign berhasil dihapus.');
    }

    public function template(Request $request)
    {
        $format = strtolower($request->input('format', 'xlsx'));
        $filename = 'template_data_staff_resign_'.now()->format('Ymd');

        if ($format === 'csv') {
            return Excel::download(new StaffResignTemplateExport, "{$filename}.csv", \Maatwebsite\Excel\Excel::CSV, [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]);
        }

        return Excel::download(new StaffResignTemplateExport, "{$filename}.xlsx");
    }

    public function import(Request $request, StaffResignImporter $importer)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:10240'],
            'mode' => ['nullable', 'string', 'in:append,replace'],
        ], [
            'file.required' => 'Silakan pilih file Excel atau CSV yang akan diunggah.',
            'file.mimes' => 'Format file harus berupa Excel (.xlsx, .xls) atau CSV (.csv).',
            'file.max' => 'Ukuran file tidak boleh melebihi 10MB.',
        ]);

        try {
            $mode = $request->input('mode', 'append');
            $result = $importer->import($request->file('file'), $mode);

            $msg = "Import berhasil: {$result['imported']} data baru ditambahkan";
            if ($result['updated'] > 0) {
                $msg .= ", {$result['updated']} data diperbarui";
            }
            if ($result['skipped'] > 0) {
                $msg .= ", {$result['skipped']} baris dilewati";
            }
            $msg .= '.';

            return back()->with('success', $msg);
        } catch (\Throwable $e) {
            return back()->with('error', 'Gagal memproses file import: '.$e->getMessage());
        }
    }

    public function export(Request $request): StreamedResponse
    {
        $query = StaffResign::query();

        if ($year = $request->input('year')) {
            if ($year !== 'all') {
                $query->whereYear('resign_date', (int) $year);
            }
        }
        if ($region = $request->input('region')) {
            if ($region !== 'all') {
                $query->where('region', $region);
            }
        }
        if ($jenis = $request->input('jenis_resign')) {
            if ($jenis !== 'all') {
                $query->where('jenis_resign', $jenis);
            }
        }

        $records = $query->orderBy('resign_date', 'desc')->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="data_staff_resign_'.now()->format('Ymd_His').'.csv"',
        ];

        return response()->stream(function () use ($records) {
            $handle = fopen('php://output', 'w');
            // Add UTF-8 BOM
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, [
                'NIK', 'Nama Karyawan', 'Tgl Join', 'Tgl Resign', 'Jabatan',
                'Kebun', 'Region', 'Jenis Resign', 'Cluster Resign', 'Alumni', 'Keterangan', 'Alasan Resign',
            ], ';');

            foreach ($records as $r) {
                fputcsv($handle, [
                    $r->employee_id,
                    $r->nama,
                    $r->join_date ? $r->join_date->format('Y-m-d') : '',
                    $r->resign_date ? $r->resign_date->format('Y-m-d') : '',
                    $r->jabatan,
                    $r->kebun,
                    $r->region,
                    $r->jenis_resign,
                    $r->cluster_resign,
                    $r->alumni,
                    $r->keterangan,
                    $r->deskripsi_resign,
                ], ';');
            }

            fclose($handle);
        }, 200, $headers);
    }
}
