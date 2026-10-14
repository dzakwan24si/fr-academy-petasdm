<?php

namespace Tests\Feature;

use App\Models\Location;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * LocationTest - Sudah disesuaikan setelah kolom koordinat dihapus.
 * Admin Lokasi (/admin/lokasi) sudah tidak ada, Master Lokasi dihapus.
 * Tabel locations masih ada beserta relasinya, hanya kolom koordinat yang hilang.
 */
class LocationTest extends TestCase
{
    use RefreshDatabase;

    public function test_location_can_be_created_without_coordinates()
    {
        $loc = Location::create(['code' => 'L1', 'name' => 'Loc 1']);

        $this->assertDatabaseHas('locations', ['code' => 'L1', 'name' => 'Loc 1']);
        $this->assertNotNull($loc->id);
    }

    public function test_location_admin_route_no_longer_exists()
    {
        $user = User::factory()->create();

        // /admin/lokasi sudah dihapus
        $response = $this->actingAs($user)->get('/admin/lokasi');
        $response->assertStatus(404);
    }
}
