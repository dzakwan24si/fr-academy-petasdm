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
        Schema::create('staff_resigns', function (Blueprint $table) {
            $table->id();
            $table->string('employee_id')->nullable()->index();
            $table->string('nama');
            $table->date('join_date')->nullable();
            $table->date('resign_date')->index();
            $table->string('jabatan')->index();
            $table->string('kebun')->index();
            $table->text('deskripsi_resign')->nullable();
            $table->string('jenis_resign', 30)->index(); // VOLUNTARY / INVOLUNTARY
            $table->string('cluster_resign', 100)->index(); // Pindah perusahaan, Working Condition, etc.
            $table->string('alumni', 30)->default('Non Alumni')->index(); // Alumni / Non Alumni
            $table->string('keterangan')->nullable();
            $table->string('region', 50)->index(); // Riau / Kalbar / Kaltim
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_resigns');
    }
};
