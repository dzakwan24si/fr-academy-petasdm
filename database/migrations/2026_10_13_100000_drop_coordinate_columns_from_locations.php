<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Drop coordinate columns: latitude, longitude, coordinate_source.
     * Kolom lain (facility_type, region, dst.) tetap utuh.
     */
    public function up(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude', 'coordinate_source']);
        });
    }

    /**
     * Rollback: kembalikan kolom koordinat agar bisa dibatalkan.
     */
    public function down(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->decimal('latitude', 9, 6)->nullable()->after('name');
            $table->decimal('longitude', 9, 6)->nullable()->after('latitude');
            $table->string('coordinate_source')->default('manual')->after('longitude');
        });
    }
};
