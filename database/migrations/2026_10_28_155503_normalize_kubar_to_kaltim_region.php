<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('companies')->where('region', 'Kubar')->update(['region' => 'Kaltim']);
        DB::table('employees')->where('region', 'Kubar')->update(['region' => 'Kaltim']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reverse needed as Kaltim is the correct canonical name for East Kalimantan operations
    }
};
