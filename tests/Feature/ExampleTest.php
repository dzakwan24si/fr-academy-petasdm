<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(302);
        $response->assertRedirect('/dashboard');
        $response->assertHeader('Content-Security-Policy');
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeaderMissing('X-Powered-By');
    }

    public function test_health_up_endpoint_is_disabled(): void
    {
        $response = $this->get('/up');
        $response->assertStatus(404);
    }

    public function test_build_manifest_endpoint_is_blocked(): void
    {
        $response = $this->get('/build/manifest.json');
        $response->assertStatus(404);
    }
}
