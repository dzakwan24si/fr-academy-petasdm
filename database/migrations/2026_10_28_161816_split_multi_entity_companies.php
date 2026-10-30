<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $now = now();

        // 1. R01: PT. Arindo Trisejahtera 1 & 2
        $cR01 = DB::table('companies')->where('code', 'R01')->first();
        if ($cR01) {
            DB::table('companies')->where('id', $cR01->id)->update([
                'code' => 'R01-1',
                'name' => 'PT. Arindo Trisejahtera 1',
                'updated_at' => $now,
            ]);

            $cR01_2Id = DB::table('companies')->insertGetId([
                'code' => 'R01-2',
                'name' => 'PT. Arindo Trisejahtera 2',
                'group' => $cR01->group ?: 'FR',
                'region' => $cR01->region ?: 'Riau',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            // Move ATS2 location (Kebun ATS2 / KR02) employees to R01-2
            $ats2LocIds = DB::table('locations')->where('code', 'KR02')->orWhere('name', 'like', '%ATS2%')->pluck('id');
            DB::table('employees')->where('company_id', $cR01->id)->whereIn('location_id', $ats2LocIds)->update([
                'company_id' => $cR01_2Id,
            ]);
        }

        // 2. R09: PT. Perdana Inti Sawit Perkasa 1 & 2
        $cR09 = DB::table('companies')->where('code', 'R09')->first();
        if ($cR09) {
            DB::table('companies')->where('id', $cR09->id)->update([
                'code' => 'R09-1',
                'name' => 'PT. Perdana Inti Sawit Perkasa 1',
                'updated_at' => $now,
            ]);

            $cR09_2Id = DB::table('companies')->insertGetId([
                'code' => 'R09-2',
                'name' => 'PT. Perdana Inti Sawit Perkasa 2',
                'group' => $cR09->group ?: 'FR',
                'region' => $cR09->region ?: 'Riau',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            // Move PISP2 locations (Kebun PISP2 / KR08, Pabrik PISP2 / PR11) employees to R09-2
            $pisp2LocIds = DB::table('locations')->whereIn('code', ['KR08', 'PR11'])->orWhere('name', 'like', '%PISP2%')->pluck('id');
            DB::table('employees')->where('company_id', $cR09->id)->whereIn('location_id', $pisp2LocIds)->update([
                'company_id' => $cR09_2Id,
            ]);
        }

        // 3. R11: PT. Subur Arum Makmur 1 & 2
        $cR11 = DB::table('companies')->where('code', 'R11')->first();
        if ($cR11) {
            DB::table('companies')->where('id', $cR11->id)->update([
                'code' => 'R11-1',
                'name' => 'PT. Subur Arum Makmur 1',
                'updated_at' => $now,
            ]);

            $cR11_2Id = DB::table('companies')->insertGetId([
                'code' => 'R11-2',
                'name' => 'PT. Subur Arum Makmur 2',
                'group' => $cR11->group ?: 'FR',
                'region' => $cR11->region ?: 'Riau',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            // Move SAM2 locations (Kebun SAM2 / KR14, Pabrik SAM2 / PR08) employees to R11-2
            $sam2LocIds = DB::table('locations')->whereIn('code', ['KR14', 'PR08'])->orWhere('name', 'like', '%SAM2%')->pluck('id');
            DB::table('employees')->where('company_id', $cR11->id)->whereIn('location_id', $sam2LocIds)->update([
                'company_id' => $cR11_2Id,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reversible if needed
    }
};
