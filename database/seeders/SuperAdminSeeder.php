<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Seed superadmin default untuk Pak Yogie Hizkia.
     */
    public function run(): void
    {
        $superadmin = User::where('nik', '2018050444')
            ->orWhere('email', 'admin@fracademy.com')
            ->first();

        if ($superadmin) {
            $superadmin->update([
                'name' => 'YOGIE HIZKIA',
                'nik' => '2018050444',
                'role' => 'superadmin',
                'job_title' => 'L&D Officer',
                'is_active' => true,
            ]);

            // Jika belum ada password, set ke 'password'
            if (empty($superadmin->password)) {
                $superadmin->update(['password' => Hash::make('password')]);
            }

            $this->command->info('Akun Superadmin YOGIE HIZKIA (NIK: 2018050444) berhasil diperbarui.');
        } else {
            User::create([
                'name' => 'YOGIE HIZKIA',
                'nik' => '2018050444',
                'email' => 'admin@fracademy.com',
                'password' => Hash::make('password'),
                'role' => 'superadmin',
                'job_title' => 'L&D Officer',
                'is_active' => true,
            ]);

            $this->command->info('Akun Superadmin YOGIE HIZKIA (NIK: 2018050444) berhasil dibuat.');
        }
    }
}
