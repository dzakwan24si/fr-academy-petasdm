# Progress Peta SDM Operasional

## Fase yang Selesai
- **Fase 0**: Setup dan Starter Code (Database Migration, Model, Seeder awal) selesai.
- **Fase 1**: Lapisan Data (Import SDM, Cleaning, Filter) selesai dan teruji.
- **Fase 2**: Visualisasi Geospasial → **Diganti ke Galeri Perusahaan** (lihat Fase 2b di bawah).
- **Fase 3**: Dashboard & Demografi selesai (berbagai komponen grafik).
- **Fase 4**: Modul Pelatihan (halaman Pelatihan) selesai.
- **Fase 5**: Modul Analisis Gabungan selesai.
- **Fase 6**: Direktori Karyawan (Tabel server-side, modal detail, export Excel) selesai.
- **Fase 7**: Data Training Mentah (Tabel server-side, modal detail karyawan, filter NIK, export Excel) selesai.
- **Fase 8**: Foto Profil Karyawan (upload, simpan, tampil di avatar) selesai.
- **Fase 9**: Sync Portal Otomatis (jadwal malam 02:00 WIB, PORTAL_SYNC_ENABLED) selesai.
- **Fase 10 (2b)**: Galeri Perusahaan — Peta dihapus, diganti galeri kard + detail halaman penuh.

## Fase yang Sedang Dikerjakan / Belum
- (Semua Fase Selesai)

## Keputusan Penting

### Fase 10 — Galeri Perusahaan (2026-10-13)
- **Peta dihapus**: Leaflet, react-leaflet, react-leaflet-cluster, leaflet.markercluster diuninstall dari npm.
- **URL lama**: `/peta` tetap ada sebagai redirect 301 ke `/perusahaan`.
- **Master Lokasi dihapus**: Route `/admin/lokasi`, `LocationController`, `Pages/Admin/Location.jsx`, `ResetCoordinatesCommand` dihapus. Data lokasi tetap ada di database.
- **Kolom koordinat dihapus**: Migrasi `2026_10_13_100000_drop_coordinate_columns_from_locations.php` menghapus `latitude`, `longitude`, `coordinate_source` dari tabel `locations`. Migrasi memiliki `down()` yang lengkap.
- **StaffDetailModal dipindahkan**: Dari `Components/Map/` ke `Components/staff/` agar tidak bergantung konteks peta.
- **Widget Dashboard tetap utuh**: `RegionalMapWidget` menggunakan SVG statis + div overlay, tidak pernah bergantung Leaflet.
- **Halaman detail**: `/perusahaan/{code}` adalah full page dengan banner gradient, KPI cards, tab Profil (grafik generasi, level, departemen, lokasi) dan tab Staf (tabel paginated + StaffDetailModal).
- **Backup database**: `storage/backups/backup_before_company_gallery_2026_10_13.sql`

### Keputusan Lama
- **Akun & Role**: Aplikasi menggunakan SATU AKUN TANPA ROLE. Kolom `role` dan `is_active` dihapus via migrasi `2026_09_28_155134_drop_company_user_and_role_columns.php`.
- **Admin Setup**: Command `php artisan sdm:create-user` untuk pembuatan akun admin.
- **Coordinate Source**: Kolom ini sudah dihapus bersama fase 10.

## Cara Menjalankan Test & Build
- Menjalankan Test: `php artisan test`
- Build Frontend: `npm run build`
- Menjalankan Frontend Dev: `npm run dev`
- Rollback koordinat (jika perlu): `php artisan migrate:rollback --step=1`
