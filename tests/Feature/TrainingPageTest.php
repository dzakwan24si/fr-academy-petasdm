<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;

class TrainingPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_pelatihan_page_loads()
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->get('/pelatihan');
        $response->assertStatus(200);
    }
    
    public function test_demografi_page_loads()
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->get('/demografi');
        $response->assertStatus(200);
    }
}
