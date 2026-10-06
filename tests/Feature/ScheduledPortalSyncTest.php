<?php

namespace Tests\Feature;

use App\Models\ImportBatch;
use App\Models\TrainingRecord;
use App\Models\User;
use App\Services\Import\TrainingImporter;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ScheduledPortalSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('services.portal.url', 'https://portal.example.com');
        Config::set('services.portal.token', 'secret-portal-token');
        Config::set('services.portal.timeout', 30);
        Config::set('services.portal.sync_enabled', true);
        Config::set('services.portal.sync_time', '02:00');
        Config::set('services.portal.sync_min_ratio', 0.8);
    }

    public function test_schedule_event_is_registered_properly()
    {
        $schedule = app(Schedule::class);
        $events = collect($schedule->events());

        $portalEvent = $events->first(fn ($event) => str_contains($event->command, 'sdm:sync-portal --scheduled'));

        $this->assertNotNull($portalEvent);
        $this->assertEquals('0 2 * * *', $portalEvent->expression);
        $this->assertEquals('Asia/Jakarta', $portalEvent->timezone);

    }

    public function test_schedule_disabled_when_sync_enabled_is_false()
    {
        Config::set('services.portal.sync_enabled', false);

        $schedule = app(Schedule::class);
        $events = collect($schedule->events());

        $portalEvent = $events->first(fn ($event) => str_contains($event->command, 'sdm:sync-portal --scheduled'));

        $this->assertNotNull($portalEvent);
        $this->assertFalse($portalEvent->filtersPass($this->app));
    }

    public function test_scheduled_sync_success_creates_scheduled_batch_with_null_user_id()
    {
        Http::fake([
            '*' => Http::response([
                'data' => [
                    [
                        'nik' => '9911',
                        'nama' => 'Scheduled Trainee',
                        'jenis_kelamin' => 'Laki-Laki',
                        'nama_pt' => 'PT Test',
                        'department' => 'IT',
                        'lokasi_kerja' => 'Jakarta',
                        'group' => 'G1',
                        'region' => 'Riau',
                        'gol' => 'IV',
                        'jabatan' => 'Staff',
                        'bulan' => 'JAN',
                        'tahun' => '2025',
                        'jml_hari' => 1,
                        'jam_pelatihan' => 8,
                        'nama_pelatihan' => 'Cyber Security',
                        'instruktur' => 'Trainer A',
                        'tempat_pelatihan' => 'Lab',
                        'reg_non_reg' => 'Reguler',
                        'internal_eksternal' => 'Internal',
                        'level' => 'staff',
                        'periode' => 'Q1',
                    ],
                ],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 1000, 'total' => 1],
            ]),
        ]);

        $importer = new TrainingImporter;
        $batch = $importer->importFromPortal(userId: null, dryRun: false, scheduled: true);

        $this->assertNull($batch->user_id);
        $this->assertStringContainsString('terjadwal', $batch->filename);
        $this->assertEquals('completed', $batch->status);
        $this->assertEquals(1, DB::table('training_records')->count());
    }

    public function test_drastic_drop_in_scheduled_mode_aborts_and_creates_failed_batch()
    {
        // Seed 10 existing training records
        TrainingRecord::factory()->count(10)->create();

        // Portal returns only 1 row (1/10 = 0.1 ratio, far below 0.8 min ratio)
        Http::fake([
            '*' => Http::response([
                'data' => [
                    [
                        'nik' => '9911',
                        'nama' => 'Single Trainee',
                        'jenis_kelamin' => 'Laki-Laki',
                        'nama_pt' => 'PT Test',
                        'department' => 'IT',
                        'lokasi_kerja' => 'Jakarta',
                        'group' => 'G1',
                        'region' => 'Riau',
                        'gol' => 'IV',
                        'jabatan' => 'Staff',
                        'bulan' => 'JAN',
                        'tahun' => '2025',
                        'jml_hari' => 1,
                        'jam_pelatihan' => 8,
                        'nama_pelatihan' => 'Course 1',
                        'instruktur' => 'Trainer A',
                        'tempat_pelatihan' => 'Lab',
                        'reg_non_reg' => 'Reguler',
                        'internal_eksternal' => 'Internal',
                        'level' => 'staff',
                        'periode' => 'Q1',
                    ],
                ],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 1000, 'total' => 1],
            ]),
        ]);

        $importer = new TrainingImporter;

        try {
            $importer->importFromPortal(userId: null, dryRun: false, scheduled: true);
            $this->fail('Expected drastic drop exception');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('Jumlah data portal turun drastis', $e->getMessage());
        }

        // Local 10 records must remain intact!
        $this->assertEquals(10, DB::table('training_records')->count());

        // Batch record must be recorded as failed
        $lastBatch = ImportBatch::latest()->first();
        $this->assertEquals('failed', $lastBatch->status);
        $this->assertStringContainsString('terjadwal', $lastBatch->filename);
    }

    public function test_zero_rows_in_scheduled_mode_aborts_and_keeps_data()
    {
        TrainingRecord::factory()->count(5)->create();

        Http::fake([
            '*' => Http::response([
                'data' => [],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 1000, 'total' => 0],
            ]),
        ]);

        $importer = new TrainingImporter;

        try {
            $importer->importFromPortal(userId: null, dryRun: false, scheduled: true);
            $this->fail('Expected zero rows exception');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('Portal mengembalikan 0 data training', $e->getMessage());
        }

        $this->assertEquals(5, DB::table('training_records')->count());
        $lastBatch = ImportBatch::latest()->first();
        $this->assertEquals('failed', $lastBatch->status);
    }

    public function test_http_500_in_scheduled_mode_keeps_data_and_logs_failed_batch()
    {
        TrainingRecord::factory()->count(5)->create();

        Http::fake([
            '*' => Http::response(null, 500),
        ]);

        $importer = new TrainingImporter;

        try {
            $importer->importFromPortal(userId: null, dryRun: false, scheduled: true);
            $this->fail('Expected 500 exception');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('Gagal', $e->getMessage());
        }

        $this->assertEquals(5, DB::table('training_records')->count());
        $lastBatch = ImportBatch::latest()->first();
        $this->assertEquals('failed', $lastBatch->status);
    }

    public function test_lock_prevents_concurrent_portal_sync()
    {
        $lock = Cache::lock('portal-sync', 600);
        $lock->get();

        $importer = new TrainingImporter;

        // Test scheduled mode when lock is held
        $scheduledBatch = $importer->importFromPortal(userId: null, dryRun: false, scheduled: true);
        $this->assertEquals('failed', $scheduledBatch->status);

        // Test manual mode when lock is held
        try {
            $importer->importFromPortal(userId: 1, dryRun: false, scheduled: false);
            $this->fail('Expected lock exception');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('Sinkronisasi sedang berjalan', $e->getMessage());
        }

        $lock->release();
    }

    public function test_import_page_renders_red_banner_when_last_batch_failed()
    {
        $user = User::factory()->create();

        ImportBatch::create([
            'user_id' => null,
            'type' => 'training',
            'filename' => 'Portal API (terjadwal)',
            'status' => 'failed',
            'rows_total' => 0,
            'warnings' => ['error' => 'Koneksi ke portal terputus'],
            'started_at' => now(),
            'finished_at' => now(),
        ]);

        $response = $this->actingAs($user)->get('/admin/import');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Import')
            ->has('batches')
            ->where('portalSyncConfig.enabled', true)
        );
    }
}
