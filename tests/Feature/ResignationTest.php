<?php

namespace Tests\Feature;

use App\Models\StaffResign;
use App\Models\User;
use App\Services\ResignationMetrics;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ResignationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_from_resignation_page()
    {
        $response = $this->get('/resign');
        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_resignation_page()
    {
        $user = User::factory()->create();

        StaffResign::create([
            'employee_id' => '1001',
            'nama' => 'Ahmad Test',
            'join_date' => '2020-01-01',
            'resign_date' => '2026-03-15',
            'jabatan' => 'Asisten Kebun',
            'kebun' => 'CPK',
            'deskripsi_resign' => 'Pindah kerja',
            'jenis_resign' => 'VOLUNTARY',
            'cluster_resign' => 'Pindah Perusahaan',
            'alumni' => 'Alumni',
            'keterangan' => 'Asisten Kebun - I/2020',
            'region' => 'Riau',
        ]);

        $response = $this->actingAs($user)->get('/resign');
        $response->assertStatus(200);

        $props = $response->original->getData()['page']['props'];

        $this->assertArrayHasKey('metrics', $props);
        $this->assertArrayHasKey('records', $props);
        $this->assertEquals(1, $props['records']['total']);
        $this->assertEquals('Ahmad Test', $props['records']['data'][0]['nama']);
        $this->assertEquals(1, $props['metrics']['kpis']['total']['count_2026']);
    }

    public function test_can_filter_resignation_by_region_and_year()
    {
        $user = User::factory()->create();

        StaffResign::create([
            'employee_id' => '1001',
            'nama' => 'Staff Riau 2026',
            'resign_date' => '2026-02-01',
            'jabatan' => 'Asisten Kebun',
            'kebun' => 'CPK',
            'jenis_resign' => 'VOLUNTARY',
            'cluster_resign' => 'Pindah Perusahaan',
            'alumni' => 'Non Alumni',
            'region' => 'Riau',
        ]);

        StaffResign::create([
            'employee_id' => '1002',
            'nama' => 'Staff Kalbar 2025',
            'resign_date' => '2025-05-01',
            'jabatan' => 'Askep Kebun',
            'kebun' => 'PSA',
            'jenis_resign' => 'INVOLUNTARY',
            'cluster_resign' => 'Under Perform',
            'alumni' => 'Alumni',
            'region' => 'Kalbar',
        ]);

        $response = $this->actingAs($user)->get('/resign?region=Riau&year=2026');
        $response->assertStatus(200);

        $props = $response->original->getData()['page']['props'];
        $this->assertEquals(1, $props['records']['total']);
        $this->assertEquals('Staff Riau 2026', $props['records']['data'][0]['nama']);
    }

    public function test_can_create_resignation_record()
    {
        $user = User::factory()->create();

        $data = [
            'employee_id' => '2026001',
            'nama' => 'Budi Santoso',
            'join_date' => '2021-02-01',
            'resign_date' => '2026-06-30',
            'jabatan' => 'Asisten Kebun',
            'kebun' => 'KTBM',
            'region' => 'Riau',
            'jenis_resign' => 'VOLUNTARY',
            'cluster_resign' => 'Pindah Perusahaan',
            'alumni' => 'Alumni',
            'keterangan' => 'Batch 2021',
            'deskripsi_resign' => 'Pindah perusahaan lain.',
        ];

        $response = $this->actingAs($user)->post('/resign', $data);
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('staff_resigns', [
            'employee_id' => '2026001',
            'nama' => 'Budi Santoso',
            'kebun' => 'KTBM',
        ]);
    }

    public function test_can_update_resignation_record()
    {
        $user = User::factory()->create();

        $record = StaffResign::create([
            'employee_id' => '2026002',
            'nama' => 'Original Name',
            'resign_date' => '2026-01-01',
            'jabatan' => 'Asisten Kebun',
            'kebun' => 'CPK',
            'region' => 'Riau',
            'jenis_resign' => 'VOLUNTARY',
            'cluster_resign' => 'Pindah Perusahaan',
            'alumni' => 'Non Alumni',
        ]);

        $response = $this->actingAs($user)->put("/resign/{$record->id}", [
            'employee_id' => '2026002',
            'nama' => 'Updated Name',
            'resign_date' => '2026-01-01',
            'jabatan' => 'Askep Kebun',
            'kebun' => 'CPK',
            'region' => 'Kalbar',
            'jenis_resign' => 'INVOLUNTARY',
            'cluster_resign' => 'Under Perform',
            'alumni' => 'Alumni',
        ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('staff_resigns', [
            'id' => $record->id,
            'nama' => 'Updated Name',
            'jabatan' => 'Askep Kebun',
            'region' => 'Kalbar',
        ]);
    }

    public function test_can_delete_resignation_record()
    {
        $user = User::factory()->create();

        $record = StaffResign::create([
            'employee_id' => '2026003',
            'nama' => 'To Delete',
            'resign_date' => '2026-01-01',
            'jabatan' => 'Asisten Kebun',
            'kebun' => 'CPK',
            'region' => 'Riau',
            'jenis_resign' => 'VOLUNTARY',
            'cluster_resign' => 'Pindah Perusahaan',
            'alumni' => 'Non Alumni',
        ]);

        $response = $this->actingAs($user)->delete("/resign/{$record->id}");
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('staff_resigns', [
            'id' => $record->id,
        ]);
    }

    public function test_can_export_resignation_records_to_csv()
    {
        $user = User::factory()->create();

        StaffResign::create([
            'employee_id' => '2026004',
            'nama' => 'Export User',
            'resign_date' => '2026-01-01',
            'jabatan' => 'Asisten Kebun',
            'kebun' => 'CPK',
            'region' => 'Riau',
            'jenis_resign' => 'VOLUNTARY',
            'cluster_resign' => 'Pindah Perusahaan',
            'alumni' => 'Non Alumni',
        ]);

        $response = $this->actingAs($user)->get('/resign/export');
        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
    }

    public function test_can_download_resignation_template_xlsx()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/resign/template?format=xlsx');
        $response->assertStatus(200);
        $this->assertStringContainsString('spreadsheet', $response->headers->get('Content-Type'));
    }

    public function test_can_download_resignation_template_csv()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/resign/template?format=csv');
        $response->assertStatus(200);
        $this->assertStringContainsString('csv', $response->headers->get('Content-Type'));
    }

    public function test_can_import_resignation_csv()
    {
        $user = User::factory()->create();

        $csvContent = "NIK;Nama Karyawan;Tgl Join;Tgl Resign;Jabatan;Kebun;Region;Jenis Resign;Cluster Resign;Alumni;Alasan Resign;Keterangan\n".
            "99001;Karyawan Import Test;2022-01-10;2026-04-15;Askep Kebun;PISP;Riau;VOLUNTARY;Pindah Perusahaan;Alumni;Pindah kerja;Ok\n".
            "99002;Karyawan Import Dua;2020-05-01;2026-05-20;Asisten Kebun;SAGM;Kubar;INVOLUNTARY;Under Perform;Non Alumni;Evaluasi;Batch 1\n";

        $file = UploadedFile::fake()->createWithContent('test_resigns.csv', $csvContent);

        $response = $this->actingAs($user)->post('/resign/import', [
            'file' => $file,
            'mode' => 'append',
        ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('staff_resigns', [
            'employee_id' => '99001',
            'nama' => 'Karyawan Import Test',
            'region' => 'Riau',
            'jenis_resign' => 'VOLUNTARY',
        ]);

        $this->assertDatabaseHas('staff_resigns', [
            'employee_id' => '99002',
            'nama' => 'Karyawan Import Dua',
            'region' => 'Kaltim', // Kubar auto normalized to Kaltim
            'jenis_resign' => 'INVOLUNTARY',
        ]);
    }

    public function test_import_requires_file()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/resign/import', []);
        $response->assertSessionHasErrors(['file']);
    }

    public function test_metrics_calculation_handles_array_and_nested_array_region_filters()
    {
        $user = User::factory()->create();

        StaffResign::create([
            'employee_id' => '1001',
            'nama' => 'Ahmad Riau',
            'join_date' => '2020-01-01',
            'resign_date' => '2026-03-15',
            'jabatan' => 'Asisten Kebun',
            'kebun' => 'CPK',
            'deskripsi_resign' => 'Pindah kerja',
            'jenis_resign' => 'VOLUNTARY',
            'cluster_resign' => 'Pindah Perusahaan',
            'alumni' => 'Alumni',
            'keterangan' => 'Batch 1',
            'region' => 'Riau',
        ]);

        StaffResign::create([
            'employee_id' => '1002',
            'nama' => 'Budi Kalbar',
            'join_date' => '2020-01-01',
            'resign_date' => '2026-04-10',
            'jabatan' => 'Asisten Kebun',
            'kebun' => 'SAGM',
            'deskripsi_resign' => 'Alasan pribadi',
            'jenis_resign' => 'VOLUNTARY',
            'cluster_resign' => 'Keluarga',
            'alumni' => 'Non Alumni',
            'keterangan' => 'Batch 2',
            'region' => 'Kalbar',
        ]);

        // 1. Array format: region[] = Riau
        $response1 = $this->actingAs($user)->get('/resign?region[]=Riau');
        $response1->assertStatus(200);
        $props1 = $response1->original->getData()['page']['props'];
        $this->assertEquals(1, $props1['records']['total']);
        $this->assertEquals('Ahmad Riau', $props1['records']['data'][0]['nama']);

        // 2. Nested array format (as sent by qs/querySerializer): region[0][0] = Riau
        $response2 = $this->actingAs($user)->get('/resign?region[0][0]=Riau');
        $response2->assertStatus(200);
        $props2 = $response2->original->getData()['page']['props'];
        $this->assertEquals(1, $props2['records']['total']);
        $this->assertEquals('Ahmad Riau', $props2['records']['data'][0]['nama']);

        // 3. Dashboard deferred summary endpoint with nested region
        $metricsService = new ResignationMetrics;
        $req = Request::create('/dashboard?region[0][0]=Riau');
        $summary = $metricsService->getSummary($req, 100);
        $this->assertIsArray($summary);
        $this->assertEquals(1, $summary['total_curr']);
    }
}
