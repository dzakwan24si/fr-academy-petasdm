# Peta SDM Operasional

Aplikasi manajemen dan visualisasi data geospasial Sumber Daya Manusia (SDM) perusahaan.

## Fitur Utama

- **Peta Interaktif SDM**: Visualisasi persebaran karyawan berdasarkan lokasi kantor dengan klaster dinamis (didukung oleh Leaflet).
- **Dashboard & Analisis Demografi**: Analisis usia, generasi, masa kerja, dan status pensiun karyawan.
- **Pelatihan**: Analisis catatan pelatihan (*training records*) dan efektivitas kompetensi.
- **Analisis Gabungan**: Melakukan perbandingan korelasi tingkat kinerja dengan *coverage* pelatihan.
- **Direktori Karyawan**: Tabel pencarian karyawan skala besar secara *server-side* dengan kapabilitas Ekspor ke Excel tanpa mengubah data tipe string menjadi ilmiah.

## Persyaratan Sistem

- PHP >= 8.3
- Composer >= 2.0
- Node.js >= 20.x
- Database: SQLite (default) / MySQL / PostgreSQL
- Web Server: Laragon / Nginx / Apache / `php artisan serve`

## Instalasi (Dari Nol)

1. **Clone repository & masuk ke direktori proyek**:
   ```bash
   git clone <repo-url> peta-sdm
   cd peta-sdm
   ```

2. **Instal dependensi Backend (PHP) & Frontend (Node)**:
   ```bash
   composer install
   npm install
   ```

3. **Setup Environment**:
   Salin file konfigurasi `.env`:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Migrasi Database**:
   Aplikasi menggunakan database SQLite secara default (`database/database.sqlite`).
   ```bash
   php artisan migrate:fresh
   ```

5. **Pembuatan Akun Admin**:
   Aplikasi ini menggunakan sistem **Single Account** tanpa role tambahan. Jalankan command ini untuk membuat akun admin dengan cepat:
   ```bash
   php artisan sdm:create-user admin@peta-sdm.com password
   ```

6. **Import Data Master SDM**:
   Masuk ke aplikasi melalui browser (`http://localhost:8000/login`) lalu akses modul **/admin/import** untuk mengunggah file CSV SDM resmi:
   - `employees-data.csv`
   - `locations-filled.csv`
   - `training_records.csv`
   - `performance_reviews.csv`

7. **Build & Run Aplikasi**:
   ```bash
   npm run build
   php artisan serve
   ```

## Catatan Penting Keamanan (Security Notes)

- **Akses Data Bersifat Rahasia**: Data karyawan mengandung 1.746 baris data pribadi termasuk (namun tak terbatas pada) Tanggal Lahir, Status Pernikahan, Agama, dan Kode PTKP. Seluruh rute aplikasi (kecuali `/login`) dilindungi dengan *middleware* `auth`.
- **Tidak Ada File Publik**: Jangan pernah membuat file viewer, debug scratch, atau menyimpan file hasil *export* di folder `public/` atau menggunakan symlink publik (`php artisan storage:link`) jika tujuannya menampung data sensitif. Semua *export* harus disalurkan langsung via browser (Response Stream Download) tanpa disimpan secara permanen di root aplikasi.
- **Single Admin Architecture**: Karena keputusan pengembangan, aplikasi didesain khusus bagi pengelola utama SDM sehingga tidak ada halaman manajemen multi-user (`/admin/users`) atau registrasi terbuka untuk mencegah eskalasi *privilege*.

## Testing

Untuk menjalankan *unit testing* dan *feature testing*, jalankan perintah:
```bash
php artisan test
```

Aplikasi ini menggunakan SQLite in-memory untuk testing secara terisolasi.
