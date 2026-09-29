<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;

class AccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_redirected_to_login()
    {
        $this->get('/dashboard')->assertRedirect('/login');
        $this->get('/peta')->assertRedirect('/login');
        $this->get('/admin/lokasi')->assertRedirect('/login');
        $this->getJson('/data/companies')->assertStatus(401);
    }

    public function test_authenticated_user_can_access_all()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/dashboard')->assertStatus(200);
        $this->actingAs($user)->get('/peta')->assertStatus(200);
        $this->actingAs($user)->get('/admin/lokasi')->assertStatus(200);
        $this->actingAs($user)->get('/karyawan')->assertStatus(200);
        $this->actingAs($user)->getJson('/data/companies')->assertStatus(200);
    }

    public function test_register_not_available()
    {
        $this->get('/register')->assertStatus(404);
        $this->post('/register')->assertStatus(404);
    }
}
