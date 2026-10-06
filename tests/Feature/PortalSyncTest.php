<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\TrainingRecord;
use App\Models\User;
use App\Services\Import\TrainingImporter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PortalSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('services.portal.url', 'https://portal.example.com');
        Config::set('services.portal.token', 'secret-portal-token');
        Config::set('services.portal.timeout', 30);
    }

    public function test_pagination_3_pages_success()
    {
        $page1Rows = array_map(fn ($i) => [
            'nik' => "EMP00{$i}",
            'nama' => "Participant {$i}",
            'jenis_kelamin' => 'Laki-Laki',
            'nama_pt' => 'PT Test',
            'department' => 'IT',
            'lokasi_kerja' => 'Jakarta',
            'group' => 'G1',
            'region' => 'Riau',
            'gol' => 'IV',
            'jabatan' => 'Staff',
            'bulan' => 'JAN',
            'tahun' => '2025',
            'jml_hari' => 2,
            'jam_pelatihan' => 16,
            'nama_pelatihan' => "Course {$i}",
            'instruktur' => 'Trainer A',
            'tempat_pelatihan' => 'Lab',
            'reg_non_reg' => 'Reguler',
            'internal_eksternal' => 'Internal',
            'level' => 'workers',
            'periode' => 'Q1',
        ], range(1, 2));

        $page2Rows = array_map(fn ($i) => [
            'nik' => "EMP00{$i}",
            'nama' => "Participant {$i}",
            'jenis_kelamin' => 'Perempuan',
            'nama_pt' => 'PT Test',
            'department' => 'HR',
            'lokasi_kerja' => 'Riau',
            'group' => 'G1',
            'region' => 'Riau',
            'gol' => 'III',
            'jabatan' => 'Staff',
            'bulan' => 'FEB',
            'tahun' => '2025',
            'jml_hari' => 1,
            'jam_pelatihan' => 8,
            'nama_pelatihan' => "Course {$i}",
            'instruktur' => 'Trainer B',
            'tempat_pelatihan' => 'Lab',
            'reg_non_reg' => 'Reguler',
            'internal_eksternal' => 'Internal',
            'level' => 'staff',
            'periode' => 'Q1',
        ], range(3, 4));

        $page3Rows = array_map(fn ($i) => [
            'nik' => "EMP00{$i}",
            'nama' => "Participant {$i}",
            'jenis_kelamin' => 'Laki-Laki',
            'nama_pt' => 'PT Test',
            'department' => 'Finance',
            'lokasi_kerja' => 'Jakarta',
            'group' => 'G1',
            'region' => 'Riau',
            'gol' => 'V',
            'jabatan' => 'Manager',
            'bulan' => 'MAR',
            'tahun' => '2025',
            'jml_hari' => 3,
            'jam_pelatihan' => 24,
            'nama_pelatihan' => "Course {$i}",
            'instruktur' => 'Trainer C',
            'tempat_pelatihan' => 'Hotel',
            'reg_non_reg' => 'Non Reguler',
            'internal_eksternal' => 'Eksternal',
            'level' => 'middle_management',
            'periode' => 'Q1',
        ], range(5, 5));

        Http::fake([
            'https://portal.example.com/api/v1/training-records/export?per_page=1000&page=1' => Http::response([
                'data' => $page1Rows,
                'meta' => ['current_page' => 1, 'last_page' => 3, 'per_page' => 1000, 'total' => 5],
            ]),
            'https://portal.example.com/api/v1/training-records/export?per_page=1000&page=2' => Http::response([
                'data' => $page2Rows,
                'meta' => ['current_page' => 2, 'last_page' => 3, 'per_page' => 1000, 'total' => 5],
            ]),
            'https://portal.example.com/api/v1/training-records/export?per_page=1000&page=3' => Http::response([
                'data' => $page3Rows,
                'meta' => ['current_page' => 3, 'last_page' => 3, 'per_page' => 1000, 'total' => 5],
            ]),
        ]);

        $importer = new TrainingImporter;
        $batch = $importer->importFromPortal();

        $this->assertEquals(5, DB::table('training_records')->count());
        $this->assertEquals(5, $batch->rows_total);
        $this->assertEquals(5, $batch->rows_imported);
        $this->assertEquals(0, $batch->rows_skipped);
    }

    public function test_field_mapping_clean_rules()
    {
        Http::fake([
            '*' => Http::response([
                'data' => [
                    [
                        'nik' => '1234567890',
                        'nama' => 'Budi',
                        'jenis_kelamin' => 'Laki-Laki',
                        'nama_pt' => 'PT Test',
                        'department' => 'L&D',
                        'lokasi_kerja' => 'Pekanbaru',
                        'group' => 'G1',
                        'region' => 'Riau',
                        'gol' => 'III/A',
                        'jabatan' => 'Operator',
                        'bulan' => 'JAN',
                        'tahun' => '2025',
                        'jml_hari' => 5,
                        'jam_pelatihan' => 248,
                        'nama_pelatihan' => 'Safety First',
                        'instruktur' => 'Internal Team',
                        'tempat_pelatihan' => 'Hall',
                        'reg_non_reg' => 'Reguler',
                        'internal_eksternal' => 'Internal',
                        'level' => 'workers',
                        'periode' => '2025-01',
                    ],
                ],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 1000, 'total' => 1],
            ]),
        ]);

        $importer = new TrainingImporter;
        $importer->importFromPortal();

        $record = TrainingRecord::first();
        $this->assertNotNull($record);
        $this->assertEquals(1, $record->month);
        $this->assertEquals('Workers', $record->level);
        $this->assertEquals(248, $record->hours);
        $this->assertEquals('L&D', $record->department);
    }

    public function test_empty_nik_handled_as_empty_status()
    {
        Http::fake([
            '*' => Http::response([
                'data' => [
                    [
                        'nik' => '',
                        'nama' => 'AAT II 2025 Trainee',
                        'jenis_kelamin' => 'Laki-Laki',
                        'nama_pt' => 'PT Test',
                        'department' => 'Ops',
                        'lokasi_kerja' => 'Site A',
                        'group' => 'G1',
                        'region' => 'Riau',
                        'gol' => 'I',
                        'jabatan' => 'Trainee',
                        'bulan' => 'MAR',
                        'tahun' => '2025',
                        'jml_hari' => 10,
                        'jam_pelatihan' => 80,
                        'nama_pelatihan' => 'AAT II',
                        'instruktur' => 'Ins A',
                        'tempat_pelatihan' => 'Site',
                        'reg_non_reg' => 'Reguler',
                        'internal_eksternal' => 'Internal',
                        'level' => 'workers',
                        'periode' => 'Q1',
                    ],
                ],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 1000, 'total' => 1],
            ]),
        ]);

        $importer = new TrainingImporter;
        $importer->importFromPortal();

        $record = TrainingRecord::first();
        $this->assertEquals('empty', $record->nik_status);
        $this->assertNull($record->employee_id);
        $this->assertEquals('AAT II 2025 Trainee', $record->participant_name);
    }

    public function test_valid_nik_links_employee_id()
    {
        $company = Company::create(['code' => 'C01', 'name' => 'PT Test']);
        $employeeId = DB::table('employees')->insertGetId([
            'employee_id' => '990011',
            'name' => 'Siti',
            'company_id' => $company->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Http::fake([
            '*' => Http::response([
                'data' => [
                    [
                        'nik' => '990011',
                        'nama' => 'Siti',
                        'jenis_kelamin' => 'Perempuan',
                        'nama_pt' => 'PT Test',
                        'department' => 'HR',
                        'lokasi_kerja' => 'Pekanbaru',
                        'group' => 'G1',
                        'region' => 'Riau',
                        'gol' => 'III',
                        'jabatan' => 'Staff',
                        'bulan' => 'APR',
                        'tahun' => '2025',
                        'jml_hari' => 1,
                        'jam_pelatihan' => 8,
                        'nama_pelatihan' => 'Leadership',
                        'instruktur' => 'Ext',
                        'tempat_pelatihan' => 'Hotel',
                        'reg_non_reg' => 'Reguler',
                        'internal_eksternal' => 'Eksternal',
                        'level' => 'staff',
                        'periode' => 'Q2',
                    ],
                ],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 1000, 'total' => 1],
            ]),
        ]);

        $importer = new TrainingImporter;
        $importer->importFromPortal();

        $record = TrainingRecord::first();
        $this->assertEquals($employeeId, $record->employee_id);
    }

    public function test_page_2_fails_keeps_existing_records_intact()
    {
        TrainingRecord::factory()->create(['participant_name' => 'Initial Local Record']);

        Http::fake([
            'https://portal.example.com/api/v1/training-records/export?per_page=1000&page=1' => Http::response([
                'data' => [
                    [
                        'nik' => '111',
                        'nama' => 'P1',
                        'jenis_kelamin' => 'L',
                        'nama_pt' => 'PT T',
                        'department' => 'D',
                        'lokasi_kerja' => 'L',
                        'group' => 'G',
                        'region' => 'Riau',
                        'gol' => 'G',
                        'jabatan' => 'J',
                        'bulan' => 'JAN',
                        'tahun' => '2025',
                        'jml_hari' => 1,
                        'jam_pelatihan' => 8,
                        'nama_pelatihan' => 'T1',
                        'instruktur' => 'I',
                        'tempat_pelatihan' => 'V',
                        'reg_non_reg' => 'Reg',
                        'internal_eksternal' => 'Int',
                        'level' => 'workers',
                        'periode' => 'P',
                    ],
                ],
                'meta' => ['current_page' => 1, 'last_page' => 2, 'per_page' => 1000, 'total' => 2],
            ]),
            'https://portal.example.com/api/v1/training-records/export?per_page=1000&page=2' => Http::response(null, 500),
        ]);

        $importer = new TrainingImporter;

        try {
            $importer->importFromPortal();
            $this->fail('Expected exception was not thrown');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('Gagal', $e->getMessage());
        }

        $this->assertEquals(1, DB::table('training_records')->count());
        $this->assertEquals('Initial Local Record', TrainingRecord::first()->participant_name);
    }

    public function test_mismatched_meta_total_aborts_import()
    {
        TrainingRecord::factory()->create(['participant_name' => 'Initial Local Record']);

        Http::fake([
            '*' => Http::response([
                'data' => [
                    [
                        'nik' => '111',
                        'nama' => 'P1',
                        'jenis_kelamin' => 'L',
                        'nama_pt' => 'PT T',
                        'department' => 'D',
                        'lokasi_kerja' => 'L',
                        'group' => 'G',
                        'region' => 'Riau',
                        'gol' => 'G',
                        'jabatan' => 'J',
                        'bulan' => 'JAN',
                        'tahun' => '2025',
                        'jml_hari' => 1,
                        'jam_pelatihan' => 8,
                        'nama_pelatihan' => 'T1',
                        'instruktur' => 'I',
                        'tempat_pelatihan' => 'V',
                        'reg_non_reg' => 'Reg',
                        'internal_eksternal' => 'Int',
                        'level' => 'workers',
                        'periode' => 'P',
                    ],
                ],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 1000, 'total' => 999],
            ]),
        ]);

        $importer = new TrainingImporter;

        try {
            $importer->importFromPortal();
            $this->fail('Expected exception was not thrown');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('tidak cocok dengan meta total', $e->getMessage());
        }

        $this->assertEquals(1, DB::table('training_records')->count());
        $this->assertEquals('Initial Local Record', TrainingRecord::first()->participant_name);
    }

    public function test_empty_response_with_existing_data_aborts_import()
    {
        TrainingRecord::factory()->create(['participant_name' => 'Initial Local Record']);

        Http::fake([
            '*' => Http::response([
                'data' => [],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 1000, 'total' => 0],
            ]),
        ]);

        $importer = new TrainingImporter;

        try {
            $importer->importFromPortal();
            $this->fail('Expected exception was not thrown');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('Portal mengembalikan 0 data training', $e->getMessage());
        }

        $this->assertEquals(1, DB::table('training_records')->count());
    }

    public function test_empty_token_or_url_throws_error_without_requests()
    {
        Config::set('services.portal.token', '');

        Http::fake();

        $importer = new TrainingImporter;

        try {
            $importer->importFromPortal();
            $this->fail('Expected exception was not thrown');
        } catch (\RuntimeException $e) {
            $this->assertEquals('Koneksi portal belum dikonfigurasi.', $e->getMessage());
        }

        Http::assertNothingSent();
    }

    public function test_dry_run_option_does_not_modify_table()
    {
        Http::fake([
            '*' => Http::response([
                'data' => [
                    [
                        'nik' => '999',
                        'nama' => 'Dry Run Trainee',
                        'jenis_kelamin' => 'L',
                        'nama_pt' => 'PT T',
                        'department' => 'D',
                        'lokasi_kerja' => 'L',
                        'group' => 'G',
                        'region' => 'Riau',
                        'gol' => 'G',
                        'jabatan' => 'J',
                        'bulan' => 'JAN',
                        'tahun' => '2025',
                        'jml_hari' => 1,
                        'jam_pelatihan' => 8,
                        'nama_pelatihan' => 'T1',
                        'instruktur' => 'I',
                        'tempat_pelatihan' => 'V',
                        'reg_non_reg' => 'Reg',
                        'internal_eksternal' => 'Int',
                        'level' => 'workers',
                        'periode' => 'P',
                    ],
                ],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 1000, 'total' => 1],
            ]),
        ]);

        $importer = new TrainingImporter;
        $batch = $importer->importFromPortal(null, true);

        $this->assertEquals(0, DB::table('training_records')->count());
        $this->assertEquals(1, $batch->rows_total);
        $this->assertEquals(1, $batch->rows_imported);
    }

    public function test_token_is_not_leaked_in_exceptions_or_logs()
    {
        Config::set('services.portal.token', 'SUPER_SECRET_TOKEN_12345');

        Http::fake([
            '*' => Http::response(['error' => 'Internal server error'], 500),
        ]);

        $importer = new TrainingImporter;

        try {
            $importer->importFromPortal();
        } catch (\RuntimeException $e) {
            $this->assertStringNotContainsString('SUPER_SECRET_TOKEN_12345', $e->getMessage());
        }
    }

    public function test_controller_sync_portal_route()
    {
        $user = User::factory()->create();

        Http::fake([
            '*' => Http::response([
                'data' => [],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 1000, 'total' => 0],
            ]),
        ]);

        $response = $this->actingAs($user)->post('/admin/import/portal-sync');

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'import.portal_sync',
        ]);
    }
}
