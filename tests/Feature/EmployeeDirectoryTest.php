<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class EmployeeDirectoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_directory_page_renders_with_data()
    {
        $user = User::factory()->create();
        
        $companyId = DB::table('companies')->insertGetId([
            'name' => 'PT Makmur',
            'code' => 'MKR',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        Employee::create([
            'employee_id' => 'E100',
            'name' => 'Budi Santoso',
            'company_id' => $companyId,
            'region' => 'Riau',
            'organization_name' => 'HR',
            'job_title_name' => 'Manager',
            'job_level_code' => 'MGR',
            'birth_date' => '1985-01-01',
            'join_date' => '2015-01-01',
            'gender' => 'Male',
            'employment_type' => 'Permanent'
        ]);

        $response = $this->actingAs($user)->get('/karyawan');
        $response->assertStatus(200);
        
        $props = $response->original->getData()['page']['props'];
        
        $this->assertEquals(1, $props['employees']['total']);
        $this->assertEquals('Budi Santoso', $props['employees']['data'][0]['name']);
        $this->assertEquals('PT Makmur', $props['employees']['data'][0]['company_name']);
        $this->assertEquals('MGR', $props['employees']['data'][0]['level']);
    }
    
    public function test_employee_export_downloads_excel_and_logs()
    {
        $user = User::factory()->create();
        
        $companyId = DB::table('companies')->insertGetId([
            'name' => 'PT Jaya',
            'code' => 'JY',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        \Carbon\Carbon::setTestNow(now());
        
        Employee::create([
            'employee_id' => 'E200',
            'name' => 'Siti Aminah',
            'company_id' => $companyId,
            'region' => 'Riau',
            'gender' => 'Female'
        ]);
        
        $response = $this->actingAs($user)->get('/karyawan/export');
        $response->assertStatus(200);
        $response->assertHeader('Content-Disposition', 'attachment; filename=direktori_karyawan_' . now()->format('Ymd_His') . '.xlsx');
        
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'EXPORT_EMPLOYEES'
        ]);
    }
}
