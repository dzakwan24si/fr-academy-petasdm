<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class AuditLogger
{
    /**
     * Catat aksi ke audit logs.
     *
     * @param int $userId ID pengguna yang melakukan aksi
     * @param string $action Nama aksi, contoh: 'IMPORT_LOCATIONS', 'VIEW_EMPLOYEE_DETAIL'
     * @param string|null $subjectType Model class, contoh: Location::class
     * @param int|null $subjectId ID dari model
     * @param array $meta Data tambahan dalam bentuk array
     * @return void
     */
    public static function log(int $userId, string $action, ?string $subjectType = null, ?int $subjectId = null, array $meta = [])
    {
        DB::table('audit_logs')->insert([
            'user_id' => $userId,
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'meta' => json_encode($meta),
            'created_at' => now(),
        ]);
    }
}
