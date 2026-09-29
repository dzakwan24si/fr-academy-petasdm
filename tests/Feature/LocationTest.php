<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use App\Models\Location;

class LocationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_coordinate()
    {
        $user = User::factory()->create();
        $loc = Location::create(['code' => 'L1', 'name' => 'Loc 1']);

        $response = $this->actingAs($user)->post("/admin/lokasi/{$loc->id}", [
            'latitude' => -6.2,
            'longitude' => 106.8
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('locations', ['code' => 'L1', 'latitude' => -6.2, 'longitude' => 106.8]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'UPDATE_LOCATION']);
    }

    public function test_coordinate_validation_boundaries()
    {
        $user = User::factory()->create();
        $loc = Location::create(['code' => 'L1', 'name' => 'Loc 1']);

        // Invalid latitude
        $response = $this->actingAs($user)->post("/admin/lokasi/{$loc->id}", [
            'latitude' => -12, // Out of bounds (-11 to 6)
            'longitude' => 106.8
        ]);
        $response->assertSessionHasErrors('latitude');

        // Invalid longitude
        $response = $this->actingAs($user)->post("/admin/lokasi/{$loc->id}", [
            'latitude' => -6.2,
            'longitude' => 90 // Out of bounds (95 to 141)
        ]);
        $response->assertSessionHasErrors('longitude');
    }

    public function test_import_locations()
    {
        $user = User::factory()->create();
        Location::create(['code' => 'L1', 'name' => 'Loc 1']);
        Location::create(['code' => 'L2', 'name' => 'Loc 2']);

        $csv = "code;latitude;longitude\nL1;-6.2;106.8\nL2;-12;100\nL3;-6;100";
        $file = UploadedFile::fake()->createWithContent('locs.csv', $csv);

        $response = $this->actingAs($user)->post('/admin/lokasi-import', [
            'file' => $file
        ]);

        $this->assertDatabaseHas('locations', ['code' => 'L1', 'latitude' => -6.2, 'longitude' => 106.8]);
        
        // L2 rejected because out of bounds (-12)
        $loc2 = Location::where('code', 'L2')->first();
        $this->assertNull($loc2->latitude);
        
        $response->assertSessionHas('warning'); // because L2 failed
        $this->assertDatabaseHas('audit_logs', ['action' => 'IMPORT_LOCATIONS']);
    }

    public function test_import_with_coordinate_source()
    {
        $user = User::factory()->create();
        Location::create(['code' => 'L1', 'name' => 'Loc 1']);
        Location::create(['code' => 'L2', 'name' => 'Loc 2']);
        Location::create(['code' => 'L3', 'name' => 'Loc 3']);

        $csv = "code;latitude;longitude;confidence\nL1;-6.2;106.8;resmi\nL2;-6;100;pendekatan-alamat\nL3;-6;100;sedang";
        $file = UploadedFile::fake()->createWithContent('locs2.csv', $csv);

        $this->actingAs($user)->post('/admin/lokasi-import', [
            'file' => $file
        ]);

        $this->assertDatabaseHas('locations', ['code' => 'L1', 'coordinate_source' => 'resmi']);
        $this->assertDatabaseHas('locations', ['code' => 'L2', 'coordinate_source' => 'pendekatan']);
        $this->assertDatabaseHas('locations', ['code' => 'L3', 'coordinate_source' => 'pendekatan']);
    }

    public function test_import_validates_region_boundaries()
    {
        $user = User::factory()->create();
        $loc1 = Location::create(['code' => 'R1', 'name' => 'Loc Riau']);
        \App\Models\Company::create(['id' => 1, 'code' => 'C1', 'name' => 'Comp']);
        // Create an employee so region is Riau
        \Illuminate\Support\Facades\DB::table('employees')->insert(['employee_id' => '123', 'name' => 'A', 'location_id' => $loc1->id, 'region' => 'Riau', 'company_id' => 1]);

        // Riau limits: lat -1.5..2.5, lng 100..104.5
        // Let's provide a valid coordinate and an invalid one
        $loc2 = Location::create(['code' => 'R2', 'name' => 'Loc Riau Out']);
        \Illuminate\Support\Facades\DB::table('employees')->insert(['employee_id' => '124', 'name' => 'B', 'location_id' => $loc2->id, 'region' => 'Riau', 'company_id' => 1]);

        $csv = "code;latitude;longitude\nR1;1.0;102.0\nR2;3.0;102.0"; // R2 lat is 3.0 (outside 2.5)
        $file = UploadedFile::fake()->createWithContent('locs_region.csv', $csv);

        $response = $this->actingAs($user)->post('/admin/lokasi-import', [
            'file' => $file
        ]);

        $this->assertDatabaseHas('locations', ['code' => 'R1', 'latitude' => 1.0]);
        $this->assertDatabaseHas('locations', ['code' => 'R2', 'latitude' => 3.0]); // It is NOT rejected, just a warning
        $response->assertSessionHas('warning'); // The session should have the warning string
    }
}
