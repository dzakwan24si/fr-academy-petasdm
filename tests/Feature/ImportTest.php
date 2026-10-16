<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Import\EmployeeImporter;
use App\Services\Import\TrainingImporter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_is_idempotent()
    {
        // Setup dummy CSV for employee
        $empCsv = "Employee ID;Employee Name;Join Date;Employment Type;Job Level Code;Job Title Code;Job Title Name;Organization Code;Organization Name;Location Code;Location Name;Company Code;Company Name;Birth Date;Birth Place;Gender;Marital Status;Religion;PTKP Code;PTKP Name;Group;Region\n".
                  'E001;John Doe;01-Jan-20;PERM;L1;T1;Manager;O1;Org 1;LOC1;Loc Name 1;C1;Comp 1;01-Jan-80;Jakarta;Male;Single;Islam;TK;TK;G1;Riau';

        $trainCsv = "NIK;Nama;Jenis Kelamin;Nama PT;Department;lokasi Kerja;Group;REGION;GOL;Jabatan;Tgl;Bln;Thn;Jml Hari;Jam Pelatihan;Nama Pelatihan;Instruktur;Tempat Pelatihan;Reg / Non Reg;Keterangan;Internal/Eksternal;Level;Periode\n".
                    'E001;John Doe;Male;Comp 1;Dept 1;Loc 1;G1;Riau;Gol 1;Manager;;JAN;2023;1;8;Training 1;Inst 1;Venue 1;Reguler;;Internal;Level 1;Q1';

        $empFile = tempnam(sys_get_temp_dir(), 'emp_');
        $trainFile = tempnam(sys_get_temp_dir(), 'trn_');
        file_put_contents($empFile, $empCsv);
        file_put_contents($trainFile, $trainCsv);

        $empImporter = new EmployeeImporter;
        $trainImporter = new TrainingImporter;

        $empFileUploaded = new UploadedFile($empFile, 'emp.csv', 'text/csv', null, true);
        $trainFileUploaded = new UploadedFile($trainFile, 'train.csv', 'text/csv', null, true);

        $empBatch1 = $empImporter->import($empFileUploaded);
        $trainBatch1 = $trainImporter->import($trainFileUploaded);

        $this->assertEquals(1, DB::table('employees')->count());
        $this->assertEquals(1, DB::table('training_records')->count());
        $this->assertEquals(1, $empBatch1->rows_imported);
        $this->assertEquals(1, $trainBatch1->rows_imported);

        // Run again, should be idempotent
        $empBatch2 = $empImporter->import($empFileUploaded);
        $trainBatch2 = $trainImporter->import($trainFileUploaded);

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

        $importer = new EmployeeImporter;
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/Kolom hilang: Employee ID/');

        try {
            $importer->import(new UploadedFile($file, 'test.csv', 'text/csv', null, true));
        } finally {
            unlink($file);
        }
    }

    public function test_import_query_count()
    {
        $empCsv = "Employee ID;Employee Name;Join Date;Employment Type;Job Level Code;Job Title Code;Job Title Name;Organization Code;Organization Name;Location Code;Location Name;Company Code;Company Name;Birth Date;Birth Place;Gender;Marital Status;Religion;PTKP Code;PTKP Name;Group;Region\n".
                  "E001;John Doe;01-Jan-20;PERM;L1;T1;Manager;O1;Org 1;LOC1;Loc Name 1;C1;Comp 1;01-Jan-80;Jakarta;Male;Single;Islam;TK;TK;G1;Riau\n".
                  'E002;Jane Doe;01-Jan-20;PERM;L1;T1;Manager;O1;Org 1;LOC1;Loc Name 1;C1;Comp 1;01-Jan-80;Jakarta;Female;Single;Islam;TK;TK;G1;Riau';
        $file = tempnam(sys_get_temp_dir(), 'emp_');
        file_put_contents($file, $empCsv);

        $importer = new EmployeeImporter;

        DB::enableQueryLog();
        $importer->import(new UploadedFile($file, 'test.csv', 'text/csv', null, true));
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
            'gender' => 'Male', 'marital_status' => 'Single', 'religion' => 'Islam', 'region' => 'Riau',
        ]);

        $empCsv = "Employee ID;Employee Name;Join Date;Employment Type;Job Level Code;Job Title Code;Job Title Name;Organization Code;Organization Name;Location Code;Location Name;Company Code;Company Name;Birth Date;Birth Place;Gender;Marital Status;Religion;PTKP Code;PTKP Name;Group;Region\n".
                  'E001;John Doe;01-Jan-20;PERM;L1;T1;Manager;O1;Org 1;LOC1;Loc Name 1;C1;Comp 1;01-Jan-80;Jakarta;Male;Single;Islam;TK;TK;G1;Riau';
        $file = tempnam(sys_get_temp_dir(), 'emp_');
        file_put_contents($file, $empCsv);

        $importer = new EmployeeImporter;
        $batch = $importer->import(new UploadedFile($file, 'test.csv', 'text/csv', null, true));

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

    public function test_import_employee_with_replace_all_cleans_old_records()
    {
        $compId = DB::table('companies')->insertGetId(['code' => 'C99', 'name' => 'Old']);
        $locId = DB::table('locations')->insertGetId(['code' => 'L99', 'name' => 'Old Loc']);

        // Insert old employee (Level A)
        $oldEmpId = DB::table('employees')->insertGetId([
            'employee_id' => 'E999', 'name' => 'Old Employee', 'company_id' => $compId, 'location_id' => $locId,
            'job_level_code' => 'A', 'join_date' => '2020-01-01', 'birth_date' => '1990-01-01',
            'employment_type' => 'PERMANENT', 'gender' => 'Male', 'marital_status' => 'Single', 'religion' => 'Islam', 'region' => 'Riau',
        ]);

        // Insert a training record linked to this employee
        DB::table('training_records')->insert([
            'nik' => 'E001',
            'employee_id' => $oldEmpId,
            'participant_name' => 'John Doe',
            'training_name' => 'Safety 101',
            'year' => 2024,
            'month' => 5,
            'hours' => 8,
        ]);

        // New CSV contains only E001 (Level C)
        $empCsv = "Employee ID;Employee Name;Join Date;Employment Type;Job Level Code;Job Title Code;Job Title Name;Organization Code;Organization Name;Location Code;Location Name;Company Code;Company Name;Birth Date;Birth Place;Gender;Marital Status;Religion;PTKP Code;PTKP Name;Group;Region\n".
                  'E001;John Doe;01-Jan-20;PERM;C;T1;Supervisor;O1;Org 1;LOC1;Loc Name 1;C1;Comp 1;01-Jan-80;Jakarta;Male;Single;Islam;TK;TK;G1;Riau';
        $file = tempnam(sys_get_temp_dir(), 'emp_');
        file_put_contents($file, $empCsv);

        $importer = new EmployeeImporter;
        // Import with replaceAll = true
        $batch = $importer->import(new UploadedFile($file, 'test.csv', 'text/csv', null, true), null, true);

        // Old employee E999 must no longer exist in DB
        $this->assertEquals(0, DB::table('employees')->where('employee_id', 'E999')->count());
        // Only 1 employee exists (E001)
        $this->assertEquals(1, DB::table('employees')->count());
        $newEmployee = DB::table('employees')->where('employee_id', 'E001')->first();
        $this->assertNotNull($newEmployee);
        $this->assertEquals('C', $newEmployee->job_level_code);

        // Training record should now be relinked to new employee E001
        $trainingRecord = DB::table('training_records')->first();
        $this->assertEquals($newEmployee->id, $trainingRecord->employee_id);

        unlink($file);
    }

    public function test_reset_data_endpoint_rejects_without_confirmation()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/admin/import/reset', [
            'target' => 'employee',
            'confirmation' => '',
        ]);

        $response->assertSessionHasErrors(['confirmation' => 'Ketik kata "HAPUS" untuk mengonfirmasi penghapusan data.']);

        $responseWrong = $this->actingAs($user)->post('/admin/import/reset', [
            'target' => 'employee',
            'confirmation' => 'SALAH',
        ]);

        $responseWrong->assertSessionHasErrors(['confirmation' => 'Ketik "HAPUS" untuk mengonfirmasi penghapusan data.']);
    }

    public function test_reset_data_endpoint_cleans_employees_safely()
    {
        $user = User::factory()->create();
        $compId = DB::table('companies')->insertGetId(['code' => 'C99', 'name' => 'Comp']);

        $empId = DB::table('employees')->insertGetId([
            'employee_id' => 'E100', 'name' => 'Test Employee', 'company_id' => $compId,
            'job_level_code' => 'D', 'join_date' => '2020-01-01', 'birth_date' => '1990-01-01',
        ]);

        DB::table('training_records')->insert([
            'nik' => 'E100',
            'employee_id' => $empId,
            'participant_name' => 'Test Employee',
            'training_name' => 'Leadership',
            'year' => 2024,
            'month' => 6,
            'hours' => 16,
        ]);

        $this->assertEquals(1, DB::table('employees')->count());

        $response = $this->actingAs($user)->post('/admin/import/reset', [
            'target' => 'employee',
            'confirmation' => 'HAPUS',
        ]);

        $response->assertSessionHas('success');
        $this->assertEquals(0, DB::table('employees')->count());

        // Training record must still exist, with employee_id set to null
        $this->assertEquals(1, DB::table('training_records')->count());
        $this->assertNull(DB::table('training_records')->first()->employee_id);
    }

    public function test_reset_data_endpoint_cleans_training_safely()
    {
        $user = User::factory()->create();

        DB::table('training_records')->insert([
            'participant_name' => 'Test Participant',
            'training_name' => 'Technical Course',
            'year' => 2024,
            'month' => 3,
            'hours' => 24,
        ]);

        $this->assertEquals(1, DB::table('training_records')->count());

        $response = $this->actingAs($user)->post('/admin/import/reset', [
            'target' => 'training',
            'confirmation' => 'HAPUS',
        ]);

        $response->assertSessionHas('success');
        $this->assertEquals(0, DB::table('training_records')->count());
    }

    public function test_download_template_endpoints()
    {
        $user = User::factory()->create();

        $responseEmp = $this->actingAs($user)->get('/admin/import/template/employee');
        $responseEmp->assertStatus(200);
        $responseEmp->assertHeader('content-disposition', 'attachment; filename=Template_Import_Karyawan.xlsx');

        $responseTrain = $this->actingAs($user)->get('/admin/import/template/training');
        $responseTrain->assertStatus(200);
        $responseTrain->assertHeader('content-disposition', 'attachment; filename=Template_Import_Pelatihan.xlsx');

        $responseInvalid = $this->actingAs($user)->get('/admin/import/template/unknown');
        $responseInvalid->assertStatus(404);
    }

    public function test_employee_import_handles_formula_in_group_and_region()
    {
        $csv = "Employee ID;Employee Name;Join Date;Employment Type;Job Level Code;Job Title Code;Job Title Name;Organization Code;Organization Name;Location Code;Location Name;Company Code;Company Name;Birth Date;Birth Place;Gender;Marital Status;Religion;PTKP Code;PTKP Name;Group;Region\n".
               'E888;Formula User;01-Jan-20;PERM;D;T1;Supervisor;O1;Org 1;LOC1;Loc Name 1;R01;Comp R01;01-Jan-80;Jakarta;Male;Single;Islam;TK;TK;=IFERROR(VLOOKUP(M2,[1]Mapping!A:B,2,0),"");=IFERROR(VLOOKUP(M2,[1]Mapping!A:C,3,0),"")';

        $file = tempnam(sys_get_temp_dir(), 'emp_formula_');
        file_put_contents($file, $csv);

        $importer = new EmployeeImporter;
        $uploaded = new UploadedFile($file, 'emp_formula.csv', 'text/csv', null, true);
        $batch = $importer->import($uploaded);

        $this->assertEquals(1, $batch->rows_imported);

        $employee = DB::table('employees')->where('employee_id', 'E888')->first();
        $this->assertNotNull($employee);
        $this->assertEquals('FR', $employee->group);
        $this->assertEquals('Riau', $employee->region);

        $company = DB::table('companies')->where('code', 'R01')->first();
        $this->assertEquals('FR', $company->group);
        $this->assertEquals('Riau', $company->region);

        unlink($file);
    }
}
