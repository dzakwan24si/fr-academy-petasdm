<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class LocationController extends Controller
{
    public function index(Request $request)
    {
        $locations = Location::query()
            ->withCount('employees')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Location', [
            'locations' => $locations
        ]);
    }

    public function update(Request $request, Location $location)
    {
        $validated = $request->validate([
            'latitude' => 'nullable|numeric|min:-11|max:6',
            'longitude' => 'nullable|numeric|min:95|max:141',
            'facility_type' => 'nullable|string'
        ]);

        $location->update($validated);

        \App\Services\AuditLogger::log(
            $request->user()->id,
            'UPDATE_LOCATION',
            Location::class,
            $location->id,
            ['description' => "Updated coordinate for location: {$location->code}"]
        );

        return back()->with('success', 'Koordinat berhasil diperbarui.');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt'
        ]);

        $file = $request->file('file');
        $fh = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($fh, 0, ';');

        if (!$header || !in_array('code', $header) || !in_array('latitude', $header) || !in_array('longitude', $header)) {
            fclose($fh);
            return back()->withErrors(['file' => 'Format kolom CSV harus memuat code;latitude;longitude dengan delimiter titik koma (;).']);
        }

        $codeIdx = array_search('code', $header);
        $latIdx = array_search('latitude', $header);
        $lngIdx = array_search('longitude', $header);
        $confIdx = array_search('confidence', $header);

        $updated = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            while (($row = fgetcsv($fh, 0, ';')) !== false) {
                if (!isset($row[$codeIdx]) || !isset($row[$latIdx]) || !isset($row[$lngIdx])) continue;
                
                $code = trim($row[$codeIdx]);
                $lat = trim($row[$latIdx]);
                $lng = trim($row[$lngIdx]);
                $conf = $confIdx !== false && isset($row[$confIdx]) ? trim($row[$confIdx]) : '';

                if ($code === '' || $lat === '' || $lng === '') {
                    $errors[] = "Baris dengan kode $code dilewati: koordinat kosong.";
                    continue;
                }

                // Strict validation: precisely one dot or no dot, and must be numeric. No comma.
                if (strpos($lat, ',') !== false || strpos($lng, ',') !== false) {
                    $errors[] = "Baris dengan kode $code ditolak: menggunakan koma sebagai desimal.";
                    continue;
                }
                if (substr_count($lat, '.') > 1 || substr_count($lng, '.') > 1) {
                    $errors[] = "Baris dengan kode $code ditolak: format angka desimal tidak valid (terlalu banyak titik).";
                    continue;
                }
                if (!is_numeric($lat) || !is_numeric($lng)) {
                    $errors[] = "Baris dengan kode $code ditolak: bukan angka yang valid.";
                    continue;
                }
                if ($lat < -11 || $lat > 6 || $lng < 95 || $lng > 141) {
                    $errors[] = "Baris dengan kode $code ditolak: di luar batas Indonesia.";
                    continue;
                }

                $loc = Location::where('code', $code)->first();
                if (!$loc) {
                    $errors[] = "Baris dengan kode $code ditolak: lokasi tidak ditemukan di database.";
                    continue;
                }

                $source = 'manual';
                if ($conf === 'resmi') {
                    $source = 'resmi';
                } elseif (in_array($conf, ['pendekatan-pabrik', 'pendekatan-alamat', 'sedang'])) {
                    $source = 'pendekatan';
                }

                // Cek kewajaran per region
                $region = \App\Models\Employee::where('location_id', $loc->id)->value('region') ?? 'Unknown';
                if ($loc->name === 'Corporate Office' || str_contains($loc->name, 'Jakarta')) {
                    $region = 'Corp';
                }

                $warn = false;
                if ($region === 'Riau' && ($lat < -1.5 || $lat > 2.5 || $lng < 100 || $lng > 104.5)) $warn = true;
                if ($region === 'Kalbar' && ($lat < -3.5 || $lat > 2 || $lng < 108 || $lng > 112)) $warn = true;
                if (($region === 'Kubar' || $region === 'Kaltim') && ($lat < -3 || $lat > 2 || $lng < 114 || $lng > 118)) $warn = true;
                if ($region === 'Corp' && ($lat < -7 || $lat > -5.5 || $lng < 106 || $lng > 107.5)) $warn = true;

                if ($warn) {
                    $errors[] = "Peringatan pada kode $code: Koordinat sepertinya di luar kotak region $region.";
                }

                $loc->update([
                    'latitude' => $lat,
                    'longitude' => $lng,
                    'coordinate_source' => $source
                ]);
                $updated++;
            }

            \App\Services\AuditLogger::log(
                $request->user()->id,
                'IMPORT_LOCATIONS',
                null,
                null,
                ['description' => "Imported coordinates for $updated locations."]
            );

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            fclose($fh);
            return back()->withErrors(['file' => 'Gagal memproses file. Pastikan delimiter titik koma (;) digunakan.']);
        }
        fclose($fh);

        if (count($errors) > 0) {
            return back()->with('warning', "Berhasil memperbarui $updated lokasi. " . count($errors) . " baris ditolak. Contoh: " . $errors[0]);
        }

        return back()->with('success', "Berhasil memperbarui $updated koordinat lokasi.");
    }
}
