<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Location;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DataEndpointTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        $this->company1Id = DB::table('companies')->insertGetId(['code' => 'CA', 'name' => 'Company A']);
        $this->company2Id = DB::table('companies')->insertGetId(['code' => 'CB', 'name' => 'Company B']);

        $this->location1Id = DB::table('locations')->insertGetId(['code' => 'L1', 'name' => 'Location 1', 'latitude' => 1.0, 'longitude' => 1.0]);
        $this->location2Id = DB::table('locations')->insertGetId(['code' => 'L2', 'name' => 'Location 2', 'latitude' => 2.0, 'longitude' => 2.0]);

        DB::table('employees')->insert([
            ['employee_id' => 'E1', 'name' => 'E1', 'company_id' => $this->company1Id, 'location_id' => $this->location1Id, 'region' => 'Riau', 'gender' => 'Male', 'birth_date' => '1990-01-01', 'join_date' => '2015-01-01'],
            ['employee_id' => 'E2', 'name' => 'E2', 'company_id' => $this->company1Id, 'location_id' => $this->location1Id, 'region' => 'Riau', 'gender' => 'Male', 'birth_date' => '1990-01-01', 'join_date' => '2015-01-01'],
            ['employee_id' => 'E3', 'name' => 'E3', 'company_id' => $this->company1Id, 'location_id' => $this->location1Id, 'region' => 'Riau', 'gender' => 'Male', 'birth_date' => '1990-01-01', 'join_date' => '2015-01-01'],

            ['employee_id' => 'E4', 'name' => 'E4', 'company_id' => $this->company2Id, 'location_id' => $this->location2Id, 'region' => 'Kalbar', 'gender' => 'Male', 'birth_date' => '1990-01-01', 'join_date' => '2015-01-01'],
            ['employee_id' => 'E5', 'name' => 'E5', 'company_id' => $this->company2Id, 'location_id' => $this->location2Id, 'region' => 'Kalbar', 'gender' => 'Male', 'birth_date' => '1990-01-01', 'join_date' => '2015-01-01'],

            // Shared location: Location 1 is used by Company B as well
            ['employee_id' => 'E6', 'name' => 'E6', 'company_id' => $this->company2Id, 'location_id' => $this->location1Id, 'region' => 'Riau', 'gender' => 'Male', 'birth_date' => '1990-01-01', 'join_date' => '2015-01-01'],
        ]);
    }

    public function test_companies_endpoint_returns_correct_shape_and_counts()
    {
        $response = $this->actingAs($this->user)->getJson('/data/companies');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'code', 'name', 'employee_count', 'location_count', 'region'],
            ],
            'total_locations',
        ]);

        // Total unique locations should be 2
        $this->assertEquals(2, $response->json('total_locations'));

        $data = collect($response->json('data'));

        // Company 1 has 3 employees, 1 location
        $c1 = $data->firstWhere('id', $this->company1Id);
        $this->assertEquals(3, $c1['employee_count']);
        $this->assertEquals(1, $c1['location_count']);

        // Company 2 has 3 employees, 2 locations (location 2 and location 1)
        $c2 = $data->firstWhere('id', $this->company2Id);
        $this->assertEquals(3, $c2['employee_count']);
        $this->assertEquals(2, $c2['location_count']);
    }

    public function test_locations_endpoint_groups_by_location_id_and_avoids_n_plus_one()
    {
        DB::enableQueryLog();

        $response = $this->actingAs($this->user)->getJson('/data/map/locations');

        $response->assertStatus(200);

        $queries = DB::getQueryLog();
        $this->assertLessThanOrEqual(5, count($queries), 'Too many queries, N+1 detected');

        // There should be exactly 2 locations
        $response->assertJsonCount(2);

        $data = collect($response->json());
        $l1 = $data->firstWhere('id', $this->location1Id);
        $this->assertCount(2, $l1['companies'], 'Location 1 should have 2 companies');
        $this->assertEquals(4, $l1['employee_count'], 'Location 1 should have 4 employees');
    }

    public function test_employee_detail_endpoint_creates_audit_log()
    {
        $employee = Employee::first();
        $this->assertNotNull($employee, 'No employee found');

        // Clear existing audit logs just in case
        DB::table('audit_logs')->truncate();

        $response = $this->actingAs($this->user)->getJson("/data/employees/{$employee->employee_id}");

        $response->assertStatus(200);
        $response->assertJsonStructure(['identitas', 'pribadi', 'kepegawaian', 'pelatihan']);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $this->user->id,
            'action' => 'VIEW_EMPLOYEE_DETAIL',
            'subject_type' => Employee::class,
            'subject_id' => $employee->id,
        ]);
    }
}
