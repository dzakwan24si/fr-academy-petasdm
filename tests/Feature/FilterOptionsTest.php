<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FilterOptionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_all_filter_options_for_authenticated_user(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/data/filter-options');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'regions',
                'trainingRegions',
                'groups',
                'companies' => [
                    '*' => ['id', 'code', 'name'],
                ],
                'locations' => [
                    '*' => ['id', 'name', 'companies'],
                ],
                'departments',
                'jobLevels',
                'employmentTypes',
                'genders',
                'generations',
            ]);
    }

    public function test_it_protects_filter_options_from_guests(): void
    {
        $response = $this->getJson('/data/filter-options');
        $response->assertStatus(401);
    }
}
