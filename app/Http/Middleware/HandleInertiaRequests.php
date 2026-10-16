<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        if ($user && ! $user->relationLoaded('employee')) {
            $user->load('employee:employee_id,job_title_name,organization_name,region');
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'nik' => $user->nik,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_active' => (bool) $user->is_active,
                    'is_superadmin' => $user->isSuperAdmin(),
                    'is_manajemen' => $user->isManajemen(),
                    'is_viewer' => $user->isViewer(),
                    'can_import' => $user->canImport(),
                    'can_manage_users' => $user->canManageUsers(),
                    'job_title' => $user->job_title ?: $user->employee?->job_title_name,
                    'employee' => $user->employee ? [
                        'job_title_name' => $user->employee->job_title_name,
                        'organization_name' => $user->employee->organization_name,
                        'region' => $user->employee->region,
                    ] : null,
                ] : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'warning' => $request->session()->get('warning'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }
}
