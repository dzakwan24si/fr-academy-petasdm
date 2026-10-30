<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CompanyGalleryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();

        // Setup data: 2 perusahaan, 2 lokasi (tanpa koordinat)
        $c1 = DB::table('companies')->insertGetId(['code' => 'R01', 'name' => 'PT Riau Satu', 'region' => 'Riau']);
        $c2 = DB::table('companies')->insertGetId(['code' => 'K01', 'name' => 'PT Kalbar Satu', 'region' => 'Kalbar']);
        $l1 = DB::table('locations')->insertGetId(['code' => 'L1', 'name' => 'Loc Riau']);
        $l2 = DB::table('locations')->insertGetId(['code' => 'L2', 'name' => 'Loc Kalbar']);

        DB::table('employees')->insert([
            ['employee_id' => 'E1', 'name' => 'Adi', 'company_id' => $c1, 'location_id' => $l1, 'region' => 'Riau', 'birth_date' => '1990-01-01', 'join_date' => '2015-01-01'],
            ['employee_id' => 'E2', 'name' => 'Budi', 'company_id' => $c2, 'location_id' => $l2, 'region' => 'Kalbar', 'birth_date' => '1990-01-01', 'join_date' => '2015-01-01'],
        ]);
    }

    public function test_gallery_page_loads()
    {
        $this->actingAs($this->user)->get('/perusahaan')->assertStatus(200);
    }

    public function test_peta_redirects_to_perusahaan()
    {
        $this->actingAs($this->user)->get('/peta')->assertRedirect('/perusahaan');
    }

    public function test_admin_lokasi_returns_404()
    {
        $this->actingAs($this->user)->get('/admin/lokasi')->assertStatus(404);
    }

    public function test_detail_page_loads_with_valid_code()
    {
        $this->actingAs($this->user)->get('/perusahaan/R01')->assertStatus(200);
    }

    public function test_detail_page_returns_404_for_invalid_code()
    {
        $this->actingAs($this->user)->get('/perusahaan/INVALID-CODE-XYZ')->assertStatus(404);
    }

    public function test_companies_api_has_correct_location_count()
    {
        $response = $this->actingAs($this->user)->getJson('/data/companies');
        $response->assertStatus(200);

        // total_locations = COUNT DISTINCT location_ids dari tabel locations yang dipakai
        // Kita punya 2 karyawan di 2 lokasi berbeda = 2 lokasi unik
        $this->assertEquals(2, $response->json('total_locations'));

        // Pastikan inisial, aliases, dan info lokasi terisi
        $first = $response->json('data.0');
        $this->assertArrayHasKey('initials', $first);
        $this->assertArrayHasKey('aliases', $first);
        $this->assertArrayHasKey('location_names', $first);
        $this->assertArrayHasKey('location_codes', $first);
    }

    public function test_location_table_has_no_coordinate_columns()
    {
        // Pastikan migrasi drop koordinat berhasil
        $columns = DB::getSchemaBuilder()->getColumnListing('locations');
        $this->assertNotContains('latitude', $columns);
        $this->assertNotContains('longitude', $columns);
        $this->assertNotContains('coordinate_source', $columns);
        // Tapi facility_type masih ada
        $this->assertContains('facility_type', $columns);
    }

    public function test_company_profile_api_returns_training_summary_and_filter_options()
    {
        $c1 = DB::table('companies')->where('code', 'R01')->first();
        $e1 = DB::table('employees')->where('employee_id', 'E1')->first();

        DB::table('training_records')->insert([
            'employee_id' => $e1->id,
            'company_id' => $c1->id,
            'participant_name' => 'Adi',
            'training_name' => 'Leadership Training',
            'hours' => 16.0,
            'year' => 2025,
            'month' => 6,
        ]);

        $response = $this->actingAs($this->user)->getJson("/data/companies/{$c1->id}/profile");
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'kpi',
            'generations',
            'levels',
            'departments',
            'locations',
            'training' => ['total_hours', 'trained_hc', 'coverage_pct'],
            'filter_options' => ['levels', 'departments', 'employment_types'],
        ]);

        $this->assertEquals(16.0, $response->json('training.total_hours'));
        $this->assertEquals(1, $response->json('training.trained_hc'));
        $this->assertEquals(100.0, $response->json('training.coverage_pct'));
    }

    public function test_company_employees_api_can_filter_by_department()
    {
        $c1 = DB::table('companies')->where('code', 'R01')->first();
        $l1 = DB::table('locations')->where('code', 'L1')->first();

        DB::table('employees')->insert([
            'employee_id' => 'E3',
            'name' => 'Citra',
            'company_id' => $c1->id,
            'location_id' => $l1->id,
            'region' => 'Riau',
            'organization_name' => 'Agronomi',
            'birth_date' => '1995-01-01',
            'join_date' => '2020-01-01',
        ]);

        DB::table('employees')->where('employee_id', 'E1')->update([
            'organization_name' => 'HRD',
        ]);

        $res = $this->actingAs($this->user)->getJson("/data/companies/{$c1->id}/employees?department=Agronomi");
        $res->assertStatus(200);
        $this->assertEquals(1, $res->json('total'));
        $this->assertEquals('Citra', $res->json('data.0.name'));
    }

    public function test_company_profile_api_returns_all_point_8_dimensions()
    {
        $c1 = DB::table('companies')->where('code', 'R01')->first();

        $response = $this->actingAs($this->user)->getJson("/data/companies/{$c1->id}/profile");
        $response->assertStatus(200);

        // Pastikan dimensi (Demografi, Masa Kerja, Pelatihan) tersedia lengkap, dan risiko_pensiun telah dihapus
        $response->assertJsonStructure([
            'demografi' => [
                'age_bins',
                'male_count',
                'female_count',
                'marital_status',
                'employment_types',
            ],
            'masa_kerja' => [
                'tenure_bins',
                'cohort_years',
                'avg_los',
                'new_hires_count',
            ],
            'training' => [
                'total_hours',
                'trained_hc',
                'coverage_pct',
                'avg_hours_per_trainee',
                'untrained_new_hires',
                'top_trainings',
                'regularity',
                'source_type',
            ],
        ]);

        $this->assertIsArray($response->json('demografi.age_bins'));
        $this->assertIsArray($response->json('masa_kerja.tenure_bins'));
        $this->assertArrayNotHasKey('risiko_pensiun', $response->json());
    }

    public function test_company_profile_filters_all_metrics_by_location_id()
    {
        $c1 = DB::table('companies')->where('code', 'R01')->first();
        $l3 = DB::table('locations')->insertGetId(['code' => 'L3', 'name' => 'Jetty']);

        DB::table('employees')->insert([
            'employee_id' => 'E4',
            'name' => 'Dedi',
            'company_id' => $c1->id,
            'location_id' => $l3,
            'region' => 'Riau',
            'birth_date' => '1985-05-05',
            'join_date' => '2010-01-01',
        ]);

        $res = $this->actingAs($this->user)->getJson("/data/companies/{$c1->id}/profile?location_id={$l3}");
        $res->assertStatus(200);

        // Hanya 1 staf di lokasi Jetty
        $this->assertEquals(1, $res->json('kpi.hc'));
        // Total perusahaan ada 2 staf (E1 dan E4)
        $this->assertEquals(2, $res->json('total_company_hc'));
        $this->assertEquals($l3, $res->json('active_location_id'));
        // Seluruh daftar lokasi tetap lengkap
        $this->assertGreaterThanOrEqual(2, count($res->json('locations')));
    }

    public function test_company_show_route_passes_initial_company_prop()
    {
        $response = $this->actingAs($this->user)->get('/perusahaan/R01');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Company/Show')
            ->has('companyCode')
            ->has('companyId')
            ->has('initialCompany')
            ->where('companyCode', 'R01')
        );
    }
}
