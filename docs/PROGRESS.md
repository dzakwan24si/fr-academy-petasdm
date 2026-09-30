# Progress Peta SDM Operasional

## Fase yang Selesai
- **Fase 0**: Setup dan Starter Code (Database Migration, Model, Seeder awal) selesai.
- **Fase 1**: Lapisan Data (Import SDM, Cleaning, Filter) selesai dan teruji.
- **Fase 2**: Visualisasi Geospasial (Peta Karyawan) selesai.
- **Fase 3**: Dashboard & Demografi selesai (berbagai komponen grafik).
- **Fase 4**: Modul Pelatihan (halaman Pelatihan) selesai.
- **Fase 5**: Modul Analisis Gabungan selesai.

- **Fase 6**: Direktori Karyawan (Tabel server-side, modal detail, export Excel) selesai.
- **Fase 7**: Data Training Mentah (Tabel server-side, modal detail karyawan yang terhubung, filter khusus status NIK, export Excel bebas scientific notation) selesai.

## Fase yang Sedang Dikerjakan / Belum
- (Semua Fase Selesai)

## Keputusan Penting
- **Akun & Role**: Aplikasi menggunakan SATU AKUN TANPA ROLE. Kolom `role` dan `is_active` telah dihapus dari database via migrasi `2026_09_28_155134_drop_company_user_and_role_columns.php`.
- **Admin Setup**: Command `php artisan sdm:create-user` ditambahkan untuk mempermudah pembuatan akun admin tunggal tanpa antarmuka registrasi.
- **Library Peta**: Menggunakan `react-leaflet-cluster` (v4.1.3).
- **Coordinate Source**: Impor `locations-filled.csv` sekarang menoleransi kolom ekstra dan memetakan `confidence` menjadi `coordinate_source` ('resmi', 'pendekatan', 'manual').

## Cara Menjalankan Test & Build
- Menjalankan Test: `php artisan test`
- Build Frontend: `npm run build`
- Menjalankan Frontend Dev: `npm run dev`
