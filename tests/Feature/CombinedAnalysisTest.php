<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Employee;
use Illuminate\Support\Facades\DB;
use App\Services\CombinedMetrics;
use Illuminate\Http\Request;
use App\Support\EmployeeFilter;

class CombinedAnalysisTest extends TestCase
{
    use RefreshDatabase;

    public function test_linked_only_filter_is_stable_when_unlinked_rows_added()
    {
        // 0. Create company
        $companyId = DB::table('companies')->insertGetId([
            'name' => 'PT Test',
            'code' => 'TEST',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 1. Create one employee
        Employee::create([
            'employee_id' => 'E001',
            'name' => 'John Doe',
            'company_id' => $companyId,
            'region' => 'Riau',
            'organization_name' => 'IT',
            'job_level_code' => 'A',
            'birth_date' => '1990-01-01',
            'join_date' => '2020-01-01',
            'gender' => 'Male'
        ]);
        $emp = Employee::first();

        // 2. Add 1 linked training record
        DB::table('training_records')->insert([
            'employee_id' => $emp->id,
            'hours' => 10,
            'participant_name' => 'John Doe',
            'nik' => 'E001',
            'year' => 2026,
            'month' => 1,
            'days' => 1,
            'training_name' => 'Test Training'
        ]);

        // Calculate metrics
        $service = new CombinedMetrics();
        $request = new Request();
        $filter = new EmployeeFilter();
        
        $metricsBefore = $service->getMetrics($request, $filter);

        // Verify some initial metrics
        $this->assertEquals(1, $metricsBefore['coverage']['region'][0]['trained']);
        $this->assertEquals(1, $metricsBefore['coverage']['region'][0]['total']);
        $this->assertEquals(10, $metricsBefore['hours']['gender'][0]['total_hours']);
        $this->assertEquals(1, $metricsBefore['banner']['total_count']);
        $this->assertEquals(0, $metricsBefore['banner']['unlinked_count']);

        // 3. Add 5 UNLINKED training records (employee_id IS NULL)
        for ($i = 0; $i < 5; $i++) {
            DB::table('training_records')->insert([
                'employee_id' => null,
                'hours' => 20,
                'participant_name' => 'Unknown',
                'nik' => null,
                'year' => 2026,
                'month' => 1,
                'days' => 1,
                'training_name' => 'Unlinked Training'
            ]);
        }

        // Calculate metrics again
        $metricsAfter = $service->getMetrics($request, $filter);

        // Banner should change
        $this->assertEquals(6, $metricsAfter['banner']['total_count']);
        $this->assertEquals(5, $metricsAfter['banner']['unlinked_count']);

        // But ACTUAL metrics should NOT change!
        $this->assertEquals($metricsBefore['coverage'], $metricsAfter['coverage']);
        $this->assertEquals($metricsBefore['hours'], $metricsAfter['hours']);
        $this->assertEquals($metricsBefore['scatter'], $metricsAfter['scatter']);
        $this->assertEquals($metricsBefore['company_ranking'], $metricsAfter['company_ranking']);
    }
}
