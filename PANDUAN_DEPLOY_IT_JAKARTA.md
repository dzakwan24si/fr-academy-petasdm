# Panduan Lengkap Deployment Monitoring Operations (Ubuntu 20.04 LTS)
**Untuk: Tim IT Jakarta & Tim Operasional FR Academy**  
*Update Terakhir: 30 Oktober 2026 (Berdasarkan Evaluasi & Pengujian Server `fr-academy-dev` / `10.121.1.17`)*

---

## 1. Arsitektur & Informasi Server

| Komponen | Nilai / Konfigurasi | Keterangan |
| :--- | :--- | :--- |
| **Sistem Operasi** | Ubuntu 20.04.6 LTS (Focal Fossa) | Kernel Linux x86_64 |
| **IP Server Internal** | `10.121.1.17` | Host server internal IT Jakarta |
| **Domain Monitoring Ops** | `https://monitoringops-academy.first-resources.com` | Dashboard Analitik & Peta SDM (Laravel 12 + Inertia React) |
| **Domain Portal FR Academy** | `https://academy.first-resources.com` | Sumber Data Training & Pelatihan |
| **Endpoint API Portal** | `https://academy.first-resources.com/api/v1/training-records/export` | Endpoint penarikan snapshot seluruh data pelatihan |
| **Web Server** | Nginx 1.18.0 (Ubuntu) | Reverse Proxy, Gzip & SSL Termination |
| **PHP Runtime** | PHP 8.4 (Custom Prefix `/usr/local/php84`) | PHP-FPM FastCGI listening on `127.0.0.1:9000` |
| **Web Root Directory** | `/var/www/monitoringops-academy.first-resources.com/public` | Wajib mengarah ke subfolder `/public` |

---

## 2. Kebutuhan PHP di Ubuntu 20.04 LTS

> [!WARNING]
> **Catatan Penting Tim IT:**  
> Repository bawaan Ubuntu 20.04 secara *default* hanya memiliki PHP 7.4. Sedangkan aplikasi Monitoring Operations membutuhkan **PHP 8.2+**.  
> Pada server `fr-academy-dev` (`10.121.1.17`), **PHP 8.4 sudah terpasang di direktori `/usr/local/php84/`**.

### 1. Standarisasi Binary CLI
Pastikan perintah `php` di terminal Ubuntu mengeksekusi PHP 8.4:
```bash
sudo ln -sf /usr/local/php84/bin/php /usr/bin/php
php -v  # Harus mencetak PHP 8.4.x
```

### 2. Matikan PHP 7.4 FPM Bawaan (Cegah Konflik RAM & Port)
```bash
sudo systemctl stop php7.4-fpm 2>/dev/null
sudo systemctl disable php7.4-fpm 2>/dev/null
```

### 3. Node.js Tidak Diperlukan di Server Produksi
Seluruh aset frontend (React, Tailwind, Vite) **sudah dikompilasi ke dalam paket rilis ZIP** pada folder `public/build`. Tim IT **tidak perlu** menginstall Node.js atau menjalankan `npm install`/`npm run build` di server.

---

## 3. Langkah-Langkah Deployment (End-to-End)

### Langkah 1: Penyiapan Direktori & Ekstraksi File
Ekstrak paket ZIP rilis ke direktori `/var/www/monitoringops-academy.first-resources.com`:
```bash
# 1. Buat folder jika belum ada
sudo mkdir -p /var/www/monitoringops-academy.first-resources.com

# 2. Ekstrak berkas rilis ZIP (sesuaikan lokasi file zip hasil upload)
sudo unzip -o monitoringops-peta-sdm-release-*.zip -d /var/www/monitoringops-academy.first-resources.com/

# 3. Masuk ke direktori aplikasi
cd /var/www/monitoringops-academy.first-resources.com
```

---

### Langkah 2: Konfigurasi Environment (`.env`)
Salin berkas contoh `.env.example` menjadi `.env`:
```bash
cp .env.example .env
nano .env
```

Sesuaikan parameter-parameter berikut dengan konfigurasi server:
```env
APP_NAME="Monitoring Operation"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://monitoringops-academy.first-resources.com

# Database MySQL Server
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=db_monitoringops
DB_USERNAME=root
DB_PASSWORD=password_db_server_anda

# Session & Cookies
SESSION_DRIVER=database
SESSION_COOKIE=monitoringops_session
SESSION_SECURE_COOKIE=true

# ==============================================================================
# INTEGRASI PORTAL FR ACADEMY (AUTO-SYNC JAM 02:00 WIB)
# ==============================================================================
PORTAL_API_URL=https://academy.first-resources.com
PORTAL_API_TOKEN=masukkan_token_bearer_resmi_dari_portal_disini
PORTAL_API_TIMEOUT=60
PORTAL_API_VERIFY_SSL=true
PORTAL_SYNC_ENABLED=true
PORTAL_SYNC_TIME=02:00
PORTAL_SYNC_MIN_RATIO=0.8

# ==============================================================================
# CLOUDFLARE TURNSTILE (CAPTCHA LOGIN)
# ==============================================================================
# Kunci sama dengan sistem Mess & Portal FR Academy
TURNSTILE_ENABLED=true
TURNSTILE_SITE_KEY=0x4AAAAAAEzPGJLBNyo86KAl
TURNSTILE_SECRET_KEY=0x4AAAAAAEzPGKSsKiRsoVbsX1tzF-N7x8k
TURNSTILE_VERIFY_SSL=true
```

Generate application key:
```bash
php artisan key:generate --force
```

---

### Langkah 3: Install Dependency PHP & Storage Link
Jalankan composer dengan binary PHP 8.4:
```bash
composer install --no-dev --optimize-autoloader --no-interaction
```

Buat symlink storage publik (sangat penting untuk foto karyawan dan dokumen):
```bash
php artisan storage:link
```
*(Catatan: Paket ZIP rilis sengaja **tidak menyertakan** folder `public/storage` agar symlink Linux di atas terbentuk sempurna tanpa konflik).*

---

### Langkah 4: Inisialisasi Database (Data Lengkap Siap Pakai)
Paket ZIP telah menyertakan berkas `database_peta_sdm_initial.sql` yang berisi data operasional lengkap (47 entitas PT terstandarisasi, sebaran lokasi kebun & pabrik, data demografi karyawan, dan tabel resign).

Jalankan perintah ini di MySQL:
```bash
# 1. Buat database baru di MySQL jika belum ada
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS db_monitoringops CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Import dump data awal (wajib sertakan charset utf8mb4)
mysql -u root -p --default-character-set=utf8mb4 db_monitoringops < database_peta_sdm_initial.sql

# 3. Jalankan migrasi untuk memastikan struktur tabel 100% mutakhir
php artisan migrate --force
```

**Kredensial Akun Superadmin Awal:**
* **NIK**: `2018050444` (Pak Yogie Hizkia)
* **Password**: `password`
*(Dapat segera diubah setelah login pertama kali di menu Profil).*

---

### Langkah 5: Hak Akses Folder (Permissions)
Berikan hak kepemilikan kepada user web server Ubuntu (`www-data`):
```bash
sudo chown -R www-data:www-data /var/www/monitoringops-academy.first-resources.com
sudo chmod -R 755 /var/www/monitoringops-academy.first-resources.com
sudo chmod -R 775 /var/www/monitoringops-academy.first-resources.com/storage /var/www/monitoringops-academy.first-resources.com/bootstrap/cache
```

---

### Langkah 6: Optimasi Cache Laravel
```bash
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 4. Konfigurasi Nginx (Teruji untuk Server Jakarta `10.121.1.17`)

Buka file konfigurasi Nginx untuk domain ini:
```bash
sudo nano /etc/nginx/sites-available/monitoringops-academy.first-resources.com
```

Gunakan konfigurasi berikut (menggunakan port FastCGI `127.0.0.1:9000` dan SSL yang sudah terpasang di server):

```nginx
server {
    listen 80;
    server_name monitoringops-academy.first-resources.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name monitoringops-academy.first-resources.com;

    # 1. Root WAJIB mengarah ke subfolder /public
    root /var/www/monitoringops-academy.first-resources.com/public;
    index index.php index.html;
    charset utf-8;

    # 2. Sertifikat SSL yang sudah ada di server internal Jakarta
    ssl_certificate /var/www/html/first-resources/first-resources_cert.crt;
    ssl_certificate_key /var/www/html/first-resources/first-resources_key.txt;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 3. Batas upload diperbesar untuk batch import Excel & ZIP foto karyawan
    client_max_body_size 100M;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    # Forwarding headers untuk proxy/load balancer
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    # 4. Static assets caching (Vite / React)
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|webp|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
        access_log off;
    }

    # 5. FastCGI PHP-FPM 8.4 (WAJIB menggunakan TCP Port 127.0.0.1:9000)
    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_param HTTP_X_FORWARDED_PROTO https;
        fastcgi_hide_header X-Powered-By;

        # Timeout 300s agar sinkronisasi Portal API ribuan data / Excel besar tidak 504 Gateway Timeout
        fastcgi_read_timeout 300;
        fastcgi_send_timeout 300;
        fastcgi_connect_timeout 60;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Aktifkan virtual host dan reload Nginx:
```bash
sudo ln -sf /etc/nginx/sites-available/monitoringops-academy.first-resources.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Manajemen Service PHP-FPM 8.4

Karena PHP 8.4 terpasang di `/usr/local/php84/`, berikut perintah operasionalnya:

* **Mengecek apakah PHP-FPM running di port 9000:**
  ```bash
  ps aux | grep php-fpm | grep -v grep
  ss -tulpn | grep 9000
  ```
* **Me-restart PHP-FPM secara bersih jika diperlukan:**
  ```bash
  sudo pkill -9 -f php-fpm
  sudo /usr/local/php84/sbin/php-fpm
  ```

---

## 6. Cron Job Auto-Sync Jam 02:00 Pagi

Agar penarikan data rekam pelatihan dari Portal FR Academy berjalan otomatis setiap dini hari pukul **02:00 WIB**:

> [!CAUTION]
> Crontab WAJIB didaftarkan di user **`www-data`** (bukan `root`) agar file log tidak terkunci permission-nya.

Buka crontab user `www-data`:
```bash
sudo crontab -u www-data -e
```

Tambahkan baris berikut di bagian paling bawah:
```cron
* * * * * cd /var/www/monitoringops-academy.first-resources.com && /usr/local/php84/bin/php artisan schedule:run >> /dev/null 2>&1
```

---

## 7. Panduan Akses Klien / Laptop Tester (DNS Mapping)

Jika domain `monitoringops-academy.first-resources.com` belum didaftarkan di DNS publik kantor dan tester mengakses via IP server `10.121.1.17`, browser laptop akan memunculkan error `DNS_PROBE_FINISHED_NXDOMAIN`.

**Solusi di laptop tester Windows:**
Buka Notepad **Run as Administrator**, buka file `C:\Windows\System32\drivers\etc\hosts`, dan tambahkan baris:
```text
10.121.1.17 academy.first-resources.com
10.121.1.17 monitoringops-academy.first-resources.com
```
Simpan file tersebut. Halaman aplikasi langsung dapat diakses di browser melalui:  
👉 **`https://monitoringops-academy.first-resources.com/login`**

---

## 8. Uji Coba & Verifikasi Integrasi Portal

1. **Uji Simulasi (Dry-Run):**
   ```bash
   cd /var/www/monitoringops-academy.first-resources.com
   php artisan sdm:sync-portal --dry-run
   ```
   *Perintah ini menguji koneksi HTTPS ke `https://academy.first-resources.com/api/v1/training-records/export` dan memverifikasi token tanpa mengubah database.*

2. **Sinkronisasi Data Penuh:**
   ```bash
   php artisan sdm:sync-portal
   ```

---

## 9. Tabel Diagnostik Error (Troubleshooting Cheatsheet)

| Gejala / Error | Penyebab Utama | Solusi Cepat |
| :--- | :--- | :--- |
| **`502 Bad Gateway`** | Nginx diarahkan ke `.sock` yang tidak ada, atau PHP-FPM di port 9000 mati | Di Nginx set `fastcgi_pass 127.0.0.1:9000;`. Pastikan service hidup dengan `sudo /usr/local/php84/sbin/php-fpm`. |
| **`403 Forbidden` (directory index ... forbidden)** | `root` Nginx kurang subfolder `/public` | Pastikan `root /var/www/monitoringops-academy.first-resources.com/public;` terpasang. |
| **`413 Request Entity Too Large`** | `client_max_body_size` Nginx masih default 1M | Tambahkan `client_max_body_size 100M;` di konfigurasi Nginx. |
| **`504 Gateway Timeout` saat sync** | FastCGI timeout Nginx terlalu singkat (< 60s) | Tambahkan `fastcgi_read_timeout 300;` di Nginx dan pastikan `PORTAL_API_TIMEOUT=60` di `.env`. |
| **Foto Karyawan 404 Not Found** | Symlink `public/storage` belum dibuat | Jalankan `php artisan storage:link` dan pastikan hak folder `sudo chown -R www-data:www-data storage/app/public`. |
| **cURL SSL error 60 / 77** | Server Linux internal belum memuat CA bundle internal | Ubah sementara `PORTAL_API_VERIFY_SSL=false` pada `.env`, lalu `php artisan config:cache`. |
| **Gagal Verifikasi Turnstile saat Login** | Koneksi server terhalang proxy atau domain belum match | Untuk pengujian/bypass darurat, set `TURNSTILE_ENABLED=false` di `.env`, lalu `php artisan config:cache`. |
| **Permission Denied pada `laravel.log`** | Crontab atau artisan dijalankan sebagai user `root` | Jalankan `sudo chown -R www-data:www-data storage` dan pastikan crontab berada di user `www-data`. |
| **`DNS_PROBE_FINISHED_NXDOMAIN` di laptop** | Domain internal belum terdaftar di DNS kantor | Tambahkan `10.121.1.17 monitoringops-academy.first-resources.com` ke file `hosts` Windows laptop. |
