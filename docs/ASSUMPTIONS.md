# Assumptions

- **Tabel pivot `company_user` ditunda**: Tabel ini tidak dibuat pada Fase 0 karena tabel `companies` baru akan dibuat pada Fase 1. Pada Fase 0, sistem auth dasar dibuat dengan `Role` Enum dan middleware terkait.
- **Instalasi Inertia + React**: Dilakukan secara manual (bukan via starter kit) untuk memastikan tidak ada konflik atau *overwrite* terhadap konfigurasi `package.json` dan Tailwind v4 yang sudah ada. Registrasi di-disable.
- **Seeder**: User demo mengambil sandi dari `.env` dan hanya dijalankan pada environment `local`.
- **Lokalisasi**: `APP_TIMEZONE=Asia/Jakarta` dan `APP_LOCALE=id` ditetapkan pada `.env` dan `config/app.php`.
- **Tema Visual**: Tailwind v4 di-extend pada `app.css` untuk menyediakan variabel tema (`--color-corporate-dark`, `--color-corporate-light`, `--color-panel-bg`, `--color-app-bg`) serta *font family* `Plus Jakarta Sans`.
- **Region Training**: "Kaltim" dipertahankan sebagai "Kaltim" dan tidak dikonversi ke "Kubar" sesuai instruksi revisi pada Fase 1.
- **Akun & Role**: Mengikuti keputusan terbaru pemilik (PRD Bagian 0.1), aplikasi hanya menggunakan SATU AKUN TANPA ROLE. Semua logika `Role`, pengecekan scope per perusahaan, tabel `company_user`, serta penyensoran `PrivacyMasker` dihapus total. Kolom `users.role` dan `users.is_active` dihapus dari database lewat migrasi baru. Semua halaman dan endpoint dilindungi middleware auth biasa.
- **Kualitas Data & Import File Excel Asli**: File CSV lama terbukti rusak dari sumbernya (NIK notasi ilmiah). Sekarang HR **diwajibkan** untuk memberikan file mentah `.xlsx` asli untuk import. NIK 14+ digit (atau 10-15 digit) adalah format NIK yang sah untuk pekerja Non-Staf dan berhasil diimpor sebagai teks murni secara akurat tanpa hilang presisi berkat modifikasi `GenericImport` dengan *Custom Value Binder*. Fitur konversi tanggal numeric bawaan Excel kini didukung di `Clean::date2`.
- **Klasifikasi Facility Turunan (Estate/Mill/HO)**: Karena DB mentah tidak menyediakan kolom klasifikasi operasional (Hanya ada Organization Name dan Location Name), klasifikasi diturunkan (derived) berdasarkan pengecekan kata kunci secara case-insensitive pada nilai *Location Name*: 
  1. Jika mengandung kata 'office' atau 'jakarta', dikategorikan sebagai **HO (Head Office)**.
  2. Jika mengandung kata 'pabrik', 'mill', 'kcp', 'biodiesel', atau 'bulking', dikategorikan sebagai **Mill**.
  3. Sisanya secara *default fallback* dikategorikan sebagai **Estate**. Logika ini diimplementasikan terpusat pada service layer backend (`WorkforceMetrics.php`).
- **Peta Diganti dengan Galeri Perusahaan (2026-10-13)**: Visualisasi geospasial (Leaflet/OpenStreetMap) dihapus sepenuhnya. Kolom `latitude`, `longitude`, dan `coordinate_source` dihapus dari tabel `locations` via migrasi reversible. Tabel `locations` tetap ada untuk relasi ke `employees`. Widget "Distribusi Tenaga Kerja per Operasional" di Dashboard menggunakan SVG statis (bukan Leaflet) sehingga tidak terpengaruh. URL `/peta` redirect 301 ke `/perusahaan` untuk menjaga backward compatibility.
- **StaffDetailModal Lokasi Netral**: Modal detail karyawan dipindahkan dari `Components/Map/` ke `Components/staff/` agar bisa digunakan oleh Direktori Karyawan, Data Training Mentah, dan halaman detail Perusahaan tanpa bergantung konteks peta.

