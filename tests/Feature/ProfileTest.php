<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/pengaturan');

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->patch('/pengaturan/profil', [
            'name' => 'Test User Updated',
            'email' => 'testupdated@example.com',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $user->refresh();

        $this->assertSame('Test User Updated', $user->name);
        $this->assertSame('testupdated@example.com', $user->email);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'account.updated',
        ]);
    }

    public function test_profile_information_rejects_invalid_email(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->patch('/pengaturan/profil', [
            'name' => 'Test User',
            'email' => 'not-an-email',
        ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_password_can_be_updated(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('password_lama'),
        ]);

        $response = $this->actingAs($user)->put('/pengaturan/password', [
            'current_password' => 'password_lama',
            'password' => 'password_baru_panjang',
            'password_confirmation' => 'password_baru_panjang',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertTrue(Hash::check('password_baru_panjang', $user->refresh()->password));

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'account.password_changed',
        ]);
    }

    public function test_correct_password_must_be_provided_to_update_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('password_lama'),
        ]);

        $response = $this->actingAs($user)->put('/pengaturan/password', [
            'current_password' => 'password_salah',
            'password' => 'password_baru_panjang',
            'password_confirmation' => 'password_baru_panjang',
        ]);

        $response->assertSessionHasErrors('current_password');
    }

    public function test_new_password_must_be_at_least_12_characters(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('password_lama'),
        ]);

        $response = $this->actingAs($user)->put('/pengaturan/password', [
            'current_password' => 'password_lama',
            'password' => 'pendek',
            'password_confirmation' => 'pendek',
        ]);

        $response->assertSessionHasErrors('password');
    }
}
