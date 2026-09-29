<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class FilterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        $companyId = DB::table('companies')->insertGetId([
            'code' => 'TESTCOMP',
            'name' => 'Test Company',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $locationId = DB::table('locations')->insertGetId([
            'code' => 'TESTLOC',
            'name' => 'Test Location',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('employees')->insert([
            [
                'employee_id' => 'EMP01',
                'name' => 'Employee 1',
                'company_id' => $companyId,
                'location_id' => $locationId,
                'region' => 'Riau',
                'job_level_code' => 'MGR',
                'employment_type' => 'PERM',
                'gender' => 'Male',
                'birth_date' => '1990-01-01',
                'join_date' => '2015-01-01',
            ],
            [
                'employee_id' => 'EMP02',
                'name' => 'Employee 2',
                'company_id' => $companyId,
                'location_id' => $locationId,
                'region' => 'Kalbar',
                'job_level_code' => 'STF',
                'employment_type' => 'CONT',
                'gender' => 'Female',
                'birth_date' => '1995-01-01',
                'join_date' => '2020-01-01',
            ],
        ]);
    }

    public function test_filter_by_region()
    {
        $response = $this->actingAs($this->user)->getJson('/data/companies?region=Riau');
        $response->assertStatus(200);

        $data = collect($response->json('data'));
        $this->assertEquals(1, $data->first()['employee_count']);
    }

    public function test_filter_by_job_level()
    {
        $response = $this->actingAs($this->user)->getJson('/data/companies?job_level_code=MGR');
        $response->assertStatus(200);

        $data = collect($response->json('data'));
        $this->assertEquals(1, $data->first()['employee_count']);
    }

    public function test_filter_by_employment_type()
    {
        $response = $this->actingAs($this->user)->getJson('/data/companies?employment_type=CONT');
        $response->assertStatus(200);

        $data = collect($response->json('data'));
        $this->assertEquals(1, $data->first()['employee_count']);
    }

    public function test_combination_filters()
    {
        // Should return 0 employees if combination does not exist
        $response = $this->actingAs($this->user)->getJson('/data/companies?region=Kalbar&job_level_code=MGR');
        $response->assertStatus(200);
        $data = collect($response->json('data'));
        $this->assertEquals(0, collect($data)->sum('employee_count'));

        // Should return 1 employee if combination matches
        $response = $this->actingAs($this->user)->getJson('/data/companies?region=Kalbar&job_level_code=STF');
        $response->assertStatus(200);
        $data = collect($response->json('data'));
        $this->assertEquals(1, collect($data)->sum('employee_count'));
    }
}
