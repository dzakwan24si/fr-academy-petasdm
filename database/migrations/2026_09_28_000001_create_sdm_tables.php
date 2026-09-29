<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $t) {
            $t->id();
            $t->string('code', 10)->unique();        // R08, B04, ...
            $t->string('name');
            $t->string('group')->nullable();         // FR / PO2 / NON GROUP
            $t->string('region')->nullable();        // Riau / Kalbar / Kubar / Corp / Non
            $t->timestamps();
        });

        // Nama PT di data training (199 varian) -> perusahaan resmi
        Schema::create('company_aliases', function (Blueprint $t) {
            $t->id();
            $t->string('alias')->unique();           // sudah dinormalisasi (uppercase, tanpa "PT.")
            $t->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $t->timestamps();
        });

        // Titik di peta. Koordinat diisi manual belakangan.
        Schema::create('locations', function (Blueprint $t) {
            $t->id();
            $t->string('code', 20)->unique();        // OF02-01, KR07, PR02, ...
            $t->string('name');
            $t->decimal('latitude', 9, 6)->nullable();
            $t->decimal('longitude', 9, 6)->nullable();
            $t->string('facility_type')->nullable(); // Kebun / Pabrik / Office (opsional)
            $t->string('region')->nullable();
            $t->timestamps();
        });

        Schema::create('employees', function (Blueprint $t) {
            $t->id();
            $t->string('employee_id', 20)->unique();
            $t->string('name');
            $t->date('join_date')->nullable();
            $t->date('birth_date')->nullable();
            $t->string('birth_place')->nullable();
            $t->string('employment_type')->nullable();
            $t->string('job_level_code', 5)->nullable();
            $t->string('job_title_code')->nullable();
            $t->string('job_title_name')->nullable();
            $t->string('organization_code')->nullable();
            $t->string('organization_name')->nullable();
            $t->foreignId('company_id')->constrained();
            $t->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $t->string('gender', 10)->nullable();
            $t->string('marital_status')->nullable();
            $t->string('religion')->nullable();
            $t->string('ptkp_code', 10)->nullable();
            $t->string('ptkp_name')->nullable();
            $t->string('group')->nullable();
            $t->string('region')->nullable();
            $t->timestamps();

            $t->index(['company_id', 'region']);
            $t->index('job_level_code');
            $t->index('birth_date');
        });

        Schema::create('training_records', function (Blueprint $t) {
            $t->id();
            $t->string('nik', 20)->nullable()->index();          // hanya NIK berstatus ok
            $t->string('nik_raw', 40)->nullable();               // nilai asli dari sumber
            $t->string('nik_status', 10)->default('ok');         // ok | empty | corrupt | invalid
            $t->foreignId('employee_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $t->string('participant_name');
            $t->string('gender', 10)->nullable();
            $t->string('company_name_raw')->nullable();          // Nama PT asli dari sumber
            $t->string('department')->nullable();
            $t->string('work_location')->nullable();
            $t->string('group')->nullable();
            $t->string('region')->nullable();
            $t->string('grade')->nullable();                     // GOL: Staf / Non Staf
            $t->string('position')->nullable();
            $t->unsignedSmallInteger('year');
            $t->unsignedTinyInteger('month');
            $t->unsignedSmallInteger('days')->nullable();
            $t->decimal('hours', 8, 2)->default(0);
            $t->string('training_name');
            $t->string('instructor')->nullable();
            $t->string('venue')->nullable();
            $t->string('regularity')->nullable();                // Reguler / Non Reguler
            $t->string('note')->nullable();
            $t->string('source_type')->nullable();               // Internal / Eksternal
            $t->string('level')->nullable();                     // Workers / Middle / Senior
            $t->string('period', 5)->nullable();                 // Q1..Q4
            $t->timestamps();

            $t->index(['year', 'month']);
            $t->index('training_name');
        });

        Schema::create('company_user', function (Blueprint $t) {
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('company_id')->constrained()->cascadeOnDelete();
            $t->primary(['user_id', 'company_id']);
        });

        Schema::create('audit_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('action');
            $t->string('subject_type')->nullable();
            $t->string('subject_id')->nullable();
            $t->string('ip_address', 45)->nullable();
            $t->text('user_agent')->nullable();
            $t->json('meta')->nullable();
            $t->timestamp('created_at')->useCurrent();

            $t->index(['user_id', 'created_at']);
            $t->index(['action', 'created_at']);
        });

        Schema::create('import_batches', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('type'); // employee / training
            $t->string('filename');
            $t->integer('rows_total')->default(0);
            $t->integer('rows_imported')->default(0);
            $t->integer('rows_skipped')->default(0);
            $t->json('warnings')->nullable();
            $t->timestamp('started_at')->nullable();
            $t->timestamp('finished_at')->nullable();
            $t->string('status'); // running, completed, failed
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('import_batches');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('company_user');
        Schema::dropIfExists('training_records');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('locations');
        Schema::dropIfExists('company_aliases');
        Schema::dropIfExists('companies');
    }
};
