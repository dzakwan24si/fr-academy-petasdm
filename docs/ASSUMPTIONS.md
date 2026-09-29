# Assumptions

- **Tabel pivot `company_user` ditunda**: Tabel ini tidak dibuat pada Fase 0 karena tabel `companies` baru akan dibuat pada Fase 1. Pada Fase 0, sistem auth dasar dibuat dengan `Role` Enum dan middleware terkait.
- **Instalasi Inertia + React**: Dilakukan secara manual (bukan via starter kit) untuk memastikan tidak ada konflik atau *overwrite* terhadap konfigurasi `package.json` dan Tailwind v4 yang sudah ada. Registrasi di-disable.
- **Seeder**: User demo mengambil sandi dari `.env` dan hanya dijalankan pada environment `local`.
- **Lokalisasi**: `APP_TIMEZONE=Asia/Jakarta` dan `APP_LOCALE=id` ditetapkan pada `.env` dan `config/app.php`.
- **Tema Visual**: Tailwind v4 di-extend pada `app.css` untuk menyediakan variabel tema (`--color-corporate-dark`, `--color-corporate-light`, `--color-panel-bg`, `--color-app-bg`) serta *font family* `Plus Jakarta Sans`.
- **Region Training**: "Kaltim" dipertahankan sebagai "Kaltim" dan tidak dikonversi ke "Kubar" sesuai instruksi revisi pada Fase 1.
- **Akun & Role**: Mengikuti keputusan terbaru pemilik (PRD Bagian 0.1), aplikasi hanya menggunakan SATU AKUN TANPA ROLE. Semua logika `Role`, pengecekan scope per perusahaan, tabel `company_user`, serta penyensoran `PrivacyMasker` dihapus total. Kolom `users.role` dan `users.is_active` dihapus dari database lewat migrasi baru. Semua halaman dan endpoint dilindungi middleware auth biasa.
