<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'nik', 'email', 'password', 'role', 'job_title', 'is_active', 'last_login_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Relasi ke data master karyawan berdasarkan NIK.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'nik', 'employee_id');
    }

    /**
     * Ambil nama jabatan pengguna (dari kolom job_title atau relasi employee).
     */
    public function getDisplayJobTitleAttribute(): ?string
    {
        return $this->job_title ?: $this->employee?->job_title_name;
    }

    /**
     * Cek apakah user adalah Superadmin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    /**
     * Cek apakah user adalah Manajemen.
     */
    public function isManajemen(): bool
    {
        return $this->role === 'manajemen';
    }

    /**
     * Cek apakah user adalah Viewer biasa.
     */
    public function isViewer(): bool
    {
        return $this->role === 'viewer';
    }

    /**
     * Cek apakah user berhak melakukan import data (Superadmin atau Manajemen).
     */
    public function canImport(): bool
    {
        return in_array($this->role, ['superadmin', 'manajemen'], true);
    }

    /**
     * Cek apakah user berhak mengelola akun pengguna (Superadmin).
     */
    public function canManageUsers(): bool
    {
        return $this->role === 'superadmin';
    }
}
