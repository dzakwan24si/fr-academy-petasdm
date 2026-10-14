<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_redirected_to_login()
    {
        $this->get('/dashboard')->assertRedirect('/login');
        // /peta masih ada (redirect 301 ke /perusahaan, tapi guest diredirect ke login lebih dulu)
        $this->get('/peta')->assertRedirect('/login');
        // /admin/lokasi sudah dihapus -> 404
        $this->get('/admin/lokasi')->assertStatus(404);
        $this->getJson('/data/companies')->assertStatus(401);
    }

    public function test_authenticated_user_can_access_all()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/dashboard')->assertStatus(200);
        // /peta redirect ke /perusahaan
        $this->actingAs($user)->get('/peta')->assertRedirect('/perusahaan');
        // /perusahaan harus 200
        $this->actingAs($user)->get('/perusahaan')->assertStatus(200);
        // /admin/lokasi sudah tidak ada
        $this->actingAs($user)->get('/admin/lokasi')->assertStatus(404);
        $this->actingAs($user)->get('/karyawan')->assertStatus(200);
        $this->actingAs($user)->getJson('/data/companies')->assertStatus(200);
    }

    public function test_register_not_available()
    {
        $this->get('/register')->assertStatus(404);
        $this->post('/register')->assertStatus(404);
    }
}
