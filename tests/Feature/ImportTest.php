<?php

namespace Tests\Feature;

use App\Services\Import\EmployeeImporter;
use App\Services\Import\TrainingImporter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_is_idempotent()
    {
        // Setup dummy CSV for employee
        $empCsv = "Employee ID;Employee Name;Join Date;Employment Type;Job Level Code;Job Title Code;Job Title Name;Organization Code;Organization Name;Location Code;Location Name;Company Code;Company Name;Birth Date;Birth Place;Gender;Marital Status;Religion;PTKP Code;PTKP Name;Group;Region\n" .
                  "E001;John Doe;01-Jan-20;PERM;L1;T1;Manager;O1;Org 1;LOC1;Loc Name 1;C1;Comp 1;01-Jan-80;Jakarta;Male;Single;Islam;TK;TK;G1;Riau";
        
        $trainCsv = "NIK;Nama;Jenis Kelamin;Nama PT;Department;lokasi Kerja;Group;REGION;GOL;Jabatan;Tgl;Bln;Thn;Jml Hari;Jam Pelatihan;Nama Pelatihan;Instruktur;Tempat Pelatihan;Reg / Non Reg;Keterangan;Internal/Eksternal;Level;Periode\n" .
                    "E001;John Doe;Male;Comp 1;Dept 1;Loc 1;G1;Riau;Gol 1;Manager;;JAN;2023;1;8;Training 1;Inst 1;Venue 1;Reguler;;Internal;Level 1;Q1";
        
        $empFile = tempnam(sys_get_temp_dir(), 'emp_');
        $trainFile = tempnam(sys_get_temp_dir(), 'trn_');
        file_put_contents($empFile, $empCsv);
        file_put_contents($trainFile, $trainCsv);

        $empImporter = new EmployeeImporter();
        $trainImporter = new TrainingImporter();

        $empBatch1 = $empImporter->import($empFile);
        $trainBatch1 = $trainImporter->import($trainFile);

        $this->assertEquals(1, DB::table('employees')->count());
        $this->assertEquals(1, DB::table('training_records')->count());
        $this->assertEquals(1, $empBatch1->rows_imported);
        $this->assertEquals(1, $trainBatch1->rows_imported);

        // Run again, should be idempotent
        $empBatch2 = $empImporter->import($empFile);
        $trainBatch2 = $trainImporter->import($trainFile);

        $this->assertEquals(1, DB::table('employees')->count());
        $this->assertEquals(1, DB::table('training_records')->count());
        $this->assertEquals(1, $empBatch2->rows_imported);
        $this->assertEquals(1, $trainBatch2->rows_imported);

        unlink($empFile);
        unlink($trainFile);
    }

    public function test_import_rejects_invalid_headers()
    {
        $csv = "Wrong Header;Another\n1;2";
        $file = tempnam(sys_get_temp_dir(), 'err_');
        file_put_contents($file, $csv);

        $importer = new EmployeeImporter();
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/Kolom hilang: Employee ID/');
        
        try {
            $importer->import($file);
        } finally {
            unlink($file);
        }
    }

    public function test_import_query_count()
    {
        $empCsv = "Employee ID;Employee Name;Join Date;Employment Type;Job Level Code;Job Title Code;Job Title Name;Organization Code;Organization Name;Location Code;Location Name;Company Code;Company Name;Birth Date;Birth Place;Gender;Marital Status;Religion;PTKP Code;PTKP Name;Group;Region\n" .
                  "E001;John Doe;01-Jan-20;PERM;L1;T1;Manager;O1;Org 1;LOC1;Loc Name 1;C1;Comp 1;01-Jan-80;Jakarta;Male;Single;Islam;TK;TK;G1;Riau\n" .
                  "E002;Jane Doe;01-Jan-20;PERM;L1;T1;Manager;O1;Org 1;LOC1;Loc Name 1;C1;Comp 1;01-Jan-80;Jakarta;Female;Single;Islam;TK;TK;G1;Riau";
        $file = tempnam(sys_get_temp_dir(), 'emp_');
        file_put_contents($file, $empCsv);

        $importer = new EmployeeImporter();
        
        DB::enableQueryLog();
        $importer->import($file);
        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        $this->assertLessThan(20, count($queries));
        unlink($file);
    }

    public function test_upsert_employee_and_warnings()
    {
        $compId = DB::table('companies')->insertGetId(['code' => 'C99', 'name' => 'Old']);
        $locId = DB::table('locations')->insertGetId(['code' => 'L99', 'name' => 'Old Loc']);

        DB::table('employees')->insert([
            'employee_id' => 'E999', 'name' => 'Old', 'company_id' => $compId, 'location_id' => $locId,
            'join_date' => '2020-01-01', 'birth_date' => '1990-01-01', 'employment_type' => 'PERMANENT',
            'gender' => 'Male', 'marital_status' => 'Single', 'religion' => 'Islam', 'region' => 'Riau'
        ]);

        $empCsv = "Employee ID;Employee Name;Join Date;Employment Type;Job Level Code;Job Title Code;Job Title Name;Organization Code;Organization Name;Location Code;Location Name;Company Code;Company Name;Birth Date;Birth Place;Gender;Marital Status;Religion;PTKP Code;PTKP Name;Group;Region\n" .
                  "E001;John Doe;01-Jan-20;PERM;L1;T1;Manager;O1;Org 1;LOC1;Loc Name 1;C1;Comp 1;01-Jan-80;Jakarta;Male;Single;Islam;TK;TK;G1;Riau";
        $file = tempnam(sys_get_temp_dir(), 'emp_');
        file_put_contents($file, $empCsv);

        $importer = new EmployeeImporter();
        $batch = $importer->import($file);
        
        $warnings = is_string($batch->warnings) ? json_decode($batch->warnings, true) : $batch->warnings;
        $hasMissingWarning = false;
        if ($warnings) {
            foreach ($warnings as $type => $w) {
                if ($type === 'missing_from_file' || (isset($w['type']) && $w['type'] === 'missing_from_file')) {
                    $hasMissingWarning = true;
                }
            }
        }

        $this->assertTrue($hasMissingWarning);
        unlink($file);
    }
}
