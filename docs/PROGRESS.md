# Progress Peta SDM Operasional

## Fase yang Selesai
- **Fase 0**: Setup dan Starter Code (Database Migration, Model, Seeder awal) selesai.
- **Fase 1**: Lapisan Data (Import SDM, Cleaning, Filter) selesai dan teruji.

## Fase yang Sedang Dikerjakan / Belum
- **Langkah 1 (Pembersihan Role)**: SELESAI. Semua logika `Role`, pengecekan scope per perusahaan, `PrivacyMasker`, dan tabel `company_user` dihapus. Rute kini sepenuhnya terbuka bagi pengguna terotentikasi.
- **Langkah 2 (Verifikasi Fase 2)**: SELESAI sebagian. Fitur import koordinat sumber telah ditambahkan (`coordinate_source`) dan divisualisasikan di peta, tes import ditambahkan.
- **Langkah 3 (Fase 3A)**: SELESAI. Komponen grafik presentasional (DonutChart, StackedBar, HorizontalBar, LineTrend, Histogram, Heatmap, Treemap, PopulationPyramid) telah dibuat di `resources/js/Components/charts` menggunakan Recharts dan Tailwind, serta diverifikasi tampilannya.
- **Langkah 4 (Fase 3B-3C)**: SELESAI. `FilterBar` telah diimplementasikan dengan `useFilters` (state persisten di URL) dan backend `FilterOptionsController`. Halaman `/dashboard` telah dibangun menggunakan Inertia deferred props, menampilkan 8 KPI, Insight Builder, 5 grafik, dan tabel Risiko Pensiun.
- **Langkah 5 (Fase 3D-3F)**: BELUM DIBANGUN. Sesi berikutnya dapat melanjutkan dengan halaman Demografi, Lokasi, dan Pelatihan.

## Keputusan Penting
- **Akun & Role**: Aplikasi menggunakan SATU AKUN TANPA ROLE. Kolom `role` dan `is_active` telah dihapus dari database via migrasi `2026_09_28_155134_drop_company_user_and_role_columns.php`.
- **Admin Setup**: Command `php artisan sdm:create-user` ditambahkan untuk mempermudah pembuatan akun admin tunggal tanpa antarmuka registrasi.
- **Library Peta**: Menggunakan `react-leaflet-cluster` (v4.1.3).
- **Coordinate Source**: Impor `locations-filled.csv` sekarang menoleransi kolom ekstra dan memetakan `confidence` menjadi `coordinate_source` ('resmi', 'pendekatan', 'manual').

## Cara Menjalankan Test & Build
- Menjalankan Test: `php artisan test`
- Build Frontend: `npm run build`
- Menjalankan Frontend Dev: `npm run dev`
