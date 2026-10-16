<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');
        $response->assertStatus(200);
    }

    public function test_user_can_authenticate_using_nik(): void
    {
        $user = User::factory()->create([
            'nik' => '2018050444',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        $response = $this->post('/login', [
            'nik' => '2018050444',
            'password' => 'password123',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect('/dashboard');
        $this->assertNotNull($user->fresh()->last_login_at);
    }

    public function test_user_cannot_authenticate_with_invalid_credentials(): void
    {
        User::factory()->create([
            'nik' => '2018050444',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->post('/login', [
            'nik' => '2018050444',
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('nik');
    }

    public function test_inactive_user_cannot_authenticate(): void
    {
        User::factory()->create([
            'nik' => '2018050444',
            'password' => Hash::make('password123'),
            'is_active' => false,
        ]);

        $response = $this->post('/login', [
            'nik' => '2018050444',
            'password' => 'password123',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('nik');
    }

    public function test_guest_is_redirected_to_login_from_admin_users(): void
    {
        $response = $this->get('/admin/users');
        $response->assertRedirect('/login');
    }

    public function test_viewer_cannot_access_user_management_page(): void
    {
        $viewer = User::factory()->viewer()->create();

        $response = $this->actingAs($viewer)->get('/admin/users');
        $response->assertStatus(403);
    }

    public function test_manajemen_cannot_access_user_management_page(): void
    {
        $manajemen = User::factory()->manajemen()->create();

        $response = $this->actingAs($manajemen)->get('/admin/users');
        $response->assertStatus(403);
    }

    public function test_superadmin_can_access_user_management_page(): void
    {
        $superadmin = User::factory()->superadmin()->create();

        $response = $this->actingAs($superadmin)->get('/admin/users');
        $response->assertStatus(200);
    }

    public function test_viewer_cannot_access_import_page(): void
    {
        $viewer = User::factory()->viewer()->create();

        $response = $this->actingAs($viewer)->get('/admin/import');
        $response->assertStatus(403);
    }

    public function test_manajemen_can_access_import_page(): void
    {
        $manajemen = User::factory()->manajemen()->create();

        $response = $this->actingAs($manajemen)->get('/admin/import');
        $response->assertStatus(200);
    }

    public function test_superadmin_can_access_import_page(): void
    {
        $superadmin = User::factory()->superadmin()->create();

        $response = $this->actingAs($superadmin)->get('/admin/import');
        $response->assertStatus(200);
    }

    private function createCompany(): int
    {
        return DB::table('companies')->insertGetId([
            'name' => 'PT First Resources',
            'code' => 'FR_TEST',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_superadmin_can_search_employees_by_nik_or_name(): void
    {
        $superadmin = User::factory()->superadmin()->create();
        $companyId = $this->createCompany();

        Employee::create([
            'employee_id' => 'EMP777',
            'name' => 'Budi Pratama',
            'company_id' => $companyId,
            'job_title_name' => 'Officer',
            'organization_name' => 'HR Operations',
            'region' => 'Riau',
            'gender' => 'Male',
        ]);

        $response = $this->actingAs($superadmin)->getJson('/admin/users/search-employee?q=Budi');
        $response->assertStatus(200);
        $response->assertJsonFragment([
            'employee_id' => 'EMP777',
            'name' => 'Budi Pratama',
            'already_registered' => false,
        ]);
    }

    public function test_superadmin_can_create_new_user_from_existing_employee(): void
    {
        $superadmin = User::factory()->superadmin()->create();
        $companyId = $this->createCompany();

        Employee::create([
            'employee_id' => 'EMP888',
            'name' => 'Siti Nurhaliza',
            'company_id' => $companyId,
            'job_title_name' => 'Finance Staff',
            'organization_name' => 'Accounting',
            'region' => 'Sumatera Utara',
            'gender' => 'Female',
        ]);

        $response = $this->actingAs($superadmin)->post('/admin/users', [
            'nik' => 'EMP888',
            'role' => 'manajemen',
            'password' => 'secret123',
            'is_active' => true,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'nik' => 'EMP888',
            'name' => 'Siti Nurhaliza',
            'role' => 'manajemen',
            'is_active' => true,
        ]);

        $createdUser = User::where('nik', 'EMP888')->first();
        $this->assertTrue(Hash::check('secret123', $createdUser->password));
    }

    public function test_cannot_create_user_with_unregistered_employee_nik(): void
    {
        $superadmin = User::factory()->superadmin()->create();

        $response = $this->actingAs($superadmin)->post('/admin/users', [
            'nik' => 'NOT_FOUND_NIK',
            'role' => 'viewer',
            'password' => 'secret123',
            'is_active' => true,
        ]);

        $response->assertSessionHasErrors('nik');
    }

    public function test_cannot_create_duplicate_user_nik(): void
    {
        $superadmin = User::factory()->superadmin()->create();
        $companyId = $this->createCompany();

        Employee::create([
            'employee_id' => 'EMP999',
            'name' => 'Ahmad Dani',
            'company_id' => $companyId,
            'gender' => 'Male',
        ]);

        User::factory()->create(['nik' => 'EMP999']);

        $response = $this->actingAs($superadmin)->post('/admin/users', [
            'nik' => 'EMP999',
            'role' => 'viewer',
            'password' => 'secret123',
        ]);

        $response->assertSessionHasErrors('nik');
    }

    public function test_superadmin_can_update_user_role(): void
    {
        $superadmin = User::factory()->superadmin()->create();
        $targetUser = User::factory()->viewer()->create();

        $response = $this->actingAs($superadmin)->put("/admin/users/{$targetUser->id}/role", [
            'role' => 'manajemen',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertSame('manajemen', $targetUser->fresh()->role);
    }

    public function test_superadmin_cannot_demote_self(): void
    {
        $superadmin = User::factory()->superadmin()->create();

        $response = $this->actingAs($superadmin)->put("/admin/users/{$superadmin->id}/role", [
            'role' => 'viewer',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertSame('superadmin', $superadmin->fresh()->role);
    }

    public function test_superadmin_can_reset_user_password(): void
    {
        $superadmin = User::factory()->superadmin()->create();
        $targetUser = User::factory()->viewer()->create([
            'password' => Hash::make('old_password'),
        ]);

        $response = $this->actingAs($superadmin)->put("/admin/users/{$targetUser->id}/password", [
            'password' => 'brand_new_password',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertTrue(Hash::check('brand_new_password', $targetUser->fresh()->password));
    }

    public function test_superadmin_can_toggle_user_status(): void
    {
        $superadmin = User::factory()->superadmin()->create();
        $targetUser = User::factory()->viewer()->create(['is_active' => true]);

        $response = $this->actingAs($superadmin)->patch("/admin/users/{$targetUser->id}/toggle-status");

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertFalse($targetUser->fresh()->is_active);

        // Toggle back to active
        $this->actingAs($superadmin)->patch("/admin/users/{$targetUser->id}/toggle-status");
        $this->assertTrue($targetUser->fresh()->is_active);
    }

    public function test_superadmin_cannot_deactivate_self(): void
    {
        $superadmin = User::factory()->superadmin()->create(['is_active' => true]);

        $response = $this->actingAs($superadmin)->patch("/admin/users/{$superadmin->id}/toggle-status");

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertTrue($superadmin->fresh()->is_active);
    }

    public function test_superadmin_can_delete_user(): void
    {
        $superadmin = User::factory()->superadmin()->create();
        $targetUser = User::factory()->viewer()->create();

        $response = $this->actingAs($superadmin)->delete("/admin/users/{$targetUser->id}");

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('users', ['id' => $targetUser->id]);
    }

    public function test_superadmin_cannot_delete_self(): void
    {
        $superadmin = User::factory()->superadmin()->create();

        $response = $this->actingAs($superadmin)->delete("/admin/users/{$superadmin->id}");

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('users', ['id' => $superadmin->id]);
    }

    public function test_cannot_delete_last_superadmin(): void
    {
        $superadmin1 = User::factory()->superadmin()->create();
        $superadmin2 = User::factory()->superadmin()->create();

        // 2 superadmins exist, deleting superadmin1 by superadmin2 works
        $this->actingAs($superadmin2)->delete("/admin/users/{$superadmin1->id}");
        $this->assertDatabaseMissing('users', ['id' => $superadmin1->id]);

        // Now only superadmin2 is left, cannot delete superadmin2
        $response = $this->actingAs($superadmin2)->delete("/admin/users/{$superadmin2->id}");
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('users', ['id' => $superadmin2->id]);
    }

    public function test_superadmin_can_create_manual_director_account_without_employee_record(): void
    {
        $superadmin = User::factory()->superadmin()->create();

        $response = $this->actingAs($superadmin)->post('/admin/users', [
            'is_manual' => true,
            'nik' => 'DIR01',
            'name' => 'Bpk. Hendra Gunawan',
            'job_title' => 'Direktur Operasional',
            'role' => 'manajemen',
            'password' => 'directorsecret123',
            'is_active' => true,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'nik' => 'DIR01',
            'name' => 'Bpk. Hendra Gunawan',
            'job_title' => 'Direktur Operasional',
            'role' => 'manajemen',
            'is_active' => true,
        ]);

        // Director should be able to log in with DIR01
        $loginResponse = $this->post('/login', [
            'nik' => 'DIR01',
            'password' => 'directorsecret123',
        ]);

        $this->assertAuthenticated();
        $loginResponse->assertRedirect('/dashboard');
    }
}
