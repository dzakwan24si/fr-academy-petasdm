<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\TrainingRecord;
use App\Models\Employee;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\TrainingRecordsExport;

class TrainingRecordDataTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
    }

    public function test_training_data_index_renders_with_pagination()
    {
        TrainingRecord::factory()->count(30)->create();

        $response = $this->get('/pelatihan/data?per_page=25');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Training/Data')
            ->has('records.data', 25)
            ->where('records.total', 30)
        );
    }

    public function test_training_data_search_works()
    {
        TrainingRecord::factory()->create(['participant_name' => 'Budi Santoso']);
        TrainingRecord::factory()->create(['participant_name' => 'Andi Wijaya']);

        $response = $this->get('/pelatihan/data?search=Budi');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Training/Data')
            ->has('records.data', 1)
            ->where('records.data.0.participant_name', 'Budi Santoso')
        );
    }

    public function test_training_data_nik_status_filter_rusak_works()
    {
        TrainingRecord::factory()->create(['nik_status' => 'ok']);
        TrainingRecord::factory()->create(['nik_status' => 'empty']);
        TrainingRecord::factory()->create(['nik_status' => 'corrupt']);
        TrainingRecord::factory()->create(['nik_status' => 'not_found']);

        $response = $this->get('/pelatihan/data?nik_status=rusak');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Training/Data')
            ->has('records.data', 1)
            ->where('records.data.0.nik_status', 'corrupt')
        );
    }
    
    public function test_training_data_nik_status_filter_terhubung_works()
    {
        $company = \App\Models\Company::create(['code' => 'TEST', 'name' => 'Test Company']);
        $employeeId = \Illuminate\Support\Facades\DB::table('employees')->insertGetId([
            'employee_id' => 'EMP123',
            'name' => 'John Doe',
            'company_id' => $company->id,
            'created_at' => now(),
            'updated_at' => now()
        ]);
        
        TrainingRecord::factory()->create(['employee_id' => $employeeId]);
        TrainingRecord::factory()->create(['employee_id' => null]);

        $response = $this->get('/pelatihan/data?nik_status=terhubung');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Training/Data')
            ->has('records.data', 1)
            ->where('records.data.0.employee_id', $employeeId)
        );
    }

    public function test_training_data_export_works_and_avoids_scientific_notation()
    {
        Excel::fake();

        // Create a record with a NIK that looks like scientific notation if parsed as number
        TrainingRecord::factory()->create([
            'nik' => '1234E567',
            'nik_raw' => '1234E567',
            'nik_status' => 'ok'
        ]);

        $response = $this->get('/pelatihan/data/export');

        $response->assertStatus(200);
        
        Excel::assertDownloaded('data_training_' . date('Ymd_His') . '.xlsx', function (TrainingRecordsExport $export) {
            return $export instanceof \Maatwebsite\Excel\Concerns\WithCustomValueBinder;
        });
    }
}
