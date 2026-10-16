<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('nik', 50)->nullable()->unique()->after('id');
            $table->string('role', 30)->default('viewer')->after('password');
            $table->boolean('is_active')->default(true)->after('role');
            $table->timestamp('last_login_at')->nullable()->after('is_active');
            $table->string('email')->nullable()->change();
        });

        // Set initial Superadmin for existing user (Pak Yogie Hizkia)
        DB::table('users')->where('id', 1)->update([
            'nik' => '2018050444',
            'name' => 'YOGIE HIZKIA',
            'role' => 'superadmin',
            'is_active' => true,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['nik', 'role', 'is_active', 'last_login_at']);
        });
    }
};
