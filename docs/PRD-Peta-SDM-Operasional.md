# PRD — Peta SDM Operasional

| | |
|---|---|
| **Versi** | 1.0 (28 September 2026) |
| **Status** | Siap dikerjakan |
| **Stack** | Laravel + Inertia.js + React + Tailwind CSS |
| **Bahasa antarmuka** | Bahasa Indonesia |
| **Bahasa kode** | Inggris (nama class, variabel, tabel, kolom) |

---

## 0. Cara memakai dokumen ini (WAJIB dibaca agent AI)

Dokumen ini adalah satu-satunya sumber kebenaran untuk proyek. Ikuti aturan kerja berikut.

1. **Jangan berasumsi versi atau konfigurasi.** Sebelum menulis kode, baca `composer.json`, `package.json`, `.env`, dan struktur folder. Catat versi Laravel, PHP, Node, dan database yang dipakai. Jika ada konflik dengan dokumen ini, ikuti kenyataan di repo lalu catat di `docs/ASSUMPTIONS.md`.
2. **Kerjakan per fase (Bagian 14).** Jangan loncat fase. Di akhir setiap fase: jalankan test, jalankan `npm run build`, lalu tulis ringkasan singkat apa yang selesai, apa yang belum, dan keputusan yang diambil.
3. **Jangan mengarang data.** Hanya tampilkan field yang benar-benar ada di kedua dataset (Bagian 3). Fitur di Bagian 2.3 ("Di luar cakupan") tidak boleh dibangun.
4. **Jika ada hal ambigu, catat sebagai pertanyaan** di `docs/OPEN_QUESTIONS.md` dan ambil keputusan paling aman (paling konservatif untuk privasi). Jangan berhenti total kecuali blocker nyata.
5. **Data pribadi karyawan tidak boleh masuk git.** File CSV sumber disimpan di `storage/app/imports/` yang harus ada di `.gitignore`. Jangan pernah menulis data nyata ke seeder, test, atau fixture. Pakai data sintetis.
6. **Tidak ada nilai hardcode untuk metrik.** Semua angka di dashboard berasal dari query. Konstanta bisnis (usia pensiun, batas generasi, ambang privasi) hidup di `config/sdm.php`.
7. **Semua teks UI dalam Bahasa Indonesia**, format angka `id-ID` (titik ribuan, koma desimal), tanggal `dd MMM yyyy`. Timezone aplikasi `Asia/Jakarta`, locale `id`.
8. **Kualitas minimum:** Form Request untuk validasi, Policy untuk otorisasi, Eloquent Resource/DTO untuk output, tidak ada query N+1, semua endpoint data terlindungi autentikasi.
9. Repo prototipe lama (React + Vite + Supabase) hanyalah **referensi desain visual**. Jangan salin kodenya, jangan pakai Supabase, jangan pakai `mockData`. Bagian 9 menjelaskan apa yang dipertahankan dari desainnya.

---

## 0.1 KEPUTUSAN PEMILIK: SATU AKUN, TANPA ROLE (menggantikan isi lain di dokumen ini)

Keputusan ini **mengalahkan** setiap bagian lain yang bertentangan. Jika ada kalimat di bawah yang menyebut role, scope, atau `management`, abaikan.

**Berlaku:**
- Aplikasi dipakai lewat **satu akun login** yang melihat **semua data** (semua perusahaan, semua halaman, semua detail karyawan, export, dan seluruh menu admin).
- Login tetap **wajib** (data pribadi karyawan). Tidak ada registrasi publik, tidak ada lupa-password lewat email publik bila tidak dikonfigurasi. Akun dibuat lewat seeder/perintah artisan dengan password dari `.env` atau prompt.
- Halaman Admin (Import, Koordinat Lokasi, Pemetaan Nama PT, Kualitas Data) tetap ada dan bisa dibuka akun tersebut.

**Dihapus dari cakupan:**
- Role (`super_admin`, `hr_admin`, `hr_company`, `management`), matriks akses 10.2, enum `Role`, middleware `EnsureRole`, Policy berbasis role.
- Scope per perusahaan, tabel pivot `company_user`, dan semua filter yang membatasi perusahaan berdasarkan user.
- Penyamaran angka kecil (`PrivacyMasker`, Bagian 10.4) dan ambang privasi di `config/sdm.php`.
- Halaman User & Akses (`/admin/users`, 11.5).
- Semua respons 403/404 berbasis role. Rute cukup dilindungi middleware `auth`.
- Kolom `users.role` dan `users.is_active` tidak dipakai (boleh dibiarkan atau dihapus lewat migrasi baru).

**Tetap berlaku:**
- Login wajib pada semua rute, HTTPS di produksi, `APP_DEBUG=false` di produksi, throttle login.
- Data sensitif tidak masuk git, CSV di `storage/app/imports/`.
- **Agama tetap tidak dibuatkan grafik/agregat** (hanya tampil di detail karyawan).
- `AuditLogger` yang sudah ada boleh dipertahankan untuk mencatat import, export, dan pembukaan detail karyawan. Halaman `/admin/audit-log` bersifat opsional dan tidak diprioritaskan.
- Semua aturan bisnis, definisi, halaman, grafik, filter, dan kualitas data tetap sama. Yang hilang hanya lapisan role dan penyamaran.

**Catatan risiko yang diterima pemilik:** satu akun bersama berarti siapa pun yang mengetahui passwordnya melihat seluruh data pribadi. Mitigasi minimal: password kuat, hanya diakses lewat jaringan/hosting yang dipercaya, dan ganti password bila ada orang yang tidak lagi berhak.

---

## 1. Ringkasan produk

### 1.1 Latar belakang
Tim HR grup perkebunan (First Resources dan anak perusahaannya) ingin melihat kondisi sumber daya manusia operasional dalam satu tempat: siapa saja karyawannya, tersebar di perusahaan dan lokasi mana, komposisi usia dan generasinya, siapa yang mendekati pensiun, dan seberapa jauh pelatihan sudah menjangkau mereka. Saat ini data ada di dua file Excel/CSV dan dianalisis manual.

### 1.2 Tujuan
| # | Tujuan | Ukuran keberhasilan |
|---|---|---|
| G1 | Satu dashboard eksekutif berisi KPI SDM dan insight otomatis | Manajemen bisa menjawab "berapa HC, berapa yang berisiko pensiun, bagaimana komposisi generasi" tanpa membuka Excel |
| G2 | Peta interaktif: peta → perusahaan → staf → detail pribadi | Dari peta sampai profil satu karyawan ≤ 3 klik |
| G3 | Analisis pelatihan dan hubungannya dengan profil karyawan | Coverage, jam pelatihan, dan tren per perusahaan/level/generasi tersedia |
| G4 | Data pribadi terlindungi | Role, scope per perusahaan, audit log, dan penyamaran angka kecil berfungsi |
| G5 | Update data mudah dan aman | HR bisa mengunggah CSV baru dan melihat laporan kualitas data tanpa developer |

### 1.3 Pengguna
| Role | Contoh | Akses |
|---|---|---|
| `super_admin` | IT / pemilik sistem | Semua, termasuk manajemen user |
| `hr_admin` | HR korporat | Semua data semua perusahaan, termasuk detail pribadi, import, export |
| `hr_company` | HR unit/perusahaan | Hanya perusahaan yang di-assign, termasuk detail pribadi perusahaan itu |
| `management` | Direksi, GM | Hanya angka agregat semua/sebagian perusahaan, **tanpa** daftar nama staf dan detail pribadi |

### 1.4 Non-goals
Aplikasi mobile native, penggajian, absensi, rekrutmen, dan integrasi HRIS real-time. Data dimasukkan lewat unggah file berkala.

## 2. Ruang lingkup

### 2.1 Di dalam cakupan
Halaman: Ringkasan Eksekutif, Perusahaan (Galeri & Detail — pengganti Peta Perusahaan), Demografi & Headcount, Masa Kerja & Rekrutmen, Risiko Pensiun, Pelatihan, Analisis Gabungan, Direktori Karyawan. Modul admin: Import Data, Pemetaan Nama PT, Kualitas Data, User & Akses, Audit Log. Filter global, export Excel, insight otomatis berbasis aturan.

### 2.2 Kondisi proyek saat ini
- Project Laravel **sudah dibuat**. React, Inertia, Tailwind, dan library grafik/peta **belum dipasang** (dikerjakan di Fase 0).
- Tersedia tiga file starter dari analisis awal (bila ada di repo, **review dulu, jangan percaya buta**, belum pernah dijalankan):
  - `database/migrations/2026_09_28_000001_create_sdm_tables.php`
  - `app/Support/Clean.php`
  - `app/Console/Commands/ImportSdm.php`
- Dua file CSV sumber: `Data Employee.csv` dan `Training Record.csv` (delimiter `;`, CRLF).

### 2.3 Di luar cakupan (jangan dibangun)
Field/fitur berikut ada di prototipe lama tetapi **tidak ada di data**: target posisi, progress IDP, histori pekerjaan, prestasi, foto karyawan, status Cuti/Aktif, fasilitas perusahaan, suksesor/talent pool/heat-map suksesi, masa jabatan (LOP), turnover/resign (belum ada data resign), menu "Laporan" dan "Alat" dari prototipe. Jika kelak dibutuhkan, itu PRD terpisah.

---

## 3. Data

### 3.1 Dataset A — Employee (`Data Employee.csv`)
23 kolom, 1.746 baris, delimiter `;`.

`No; Employee ID; Employee Name; Join Date; Employment Type; Job Level Code; Job Title Code; Job Title Name; Organization Code; Organization Name; Location Code; Location Name; Company Code; Company Name; Birth Date; Birth Place; Gender; Marital Status; Religion; PTKP Code; PTKP Name; Group; Region`

| Kolom sumber | Kolom DB | Catatan |
|---|---|---|
| Employee ID | `employees.employee_id` | String 10 digit, unik. **Jangan diubah jadi integer** (bisa berawalan angka nol) |
| Employee Name | `name` | |
| Join Date | `join_date` | Format `04-Dec-06` (tahun 2 digit). Lihat 3.4 |
| Employment Type | `employment_type` | PERMANENT, TRAINEE, PROBATION, CONTRACT, ACTING |
| Job Level Code | `job_level_code` | A–F dan 1–5. Lihat 3.5 |
| Job Title Code / Name | `job_title_code/name` | |
| Organization Code / Name | `organization_code/name` | Departemen (mis. LOGISTIC RIAU, AGRONOMY RIAU) |
| Location Code / Name | `locations` | 92 lokasi, relasi 1:1 kode↔nama |
| Company Code / Name | `companies` | 44 perusahaan, relasi 1:1 kode↔nama |
| Birth Date | `birth_date` | Tahun 2 digit. Lihat 3.4 |
| Birth Place | `birth_place` | 8 kosong |
| Gender | `gender` | Male / Female |
| Marital Status | `marital_status` | Nikah, Belum Nikah, Janda, Duda |
| Religion | `religion` | Islam, Christian, Catholic, Buddha, Hindu |
| PTKP Code / Name | `ptkp_code/name` | TK/0, K/0–K/3, TK/1, TK/2 |
| Group | `group` | FR, PO2, NON GROUP |
| Region | `region` | Riau, Kalbar, Kubar, Corp, Non |

**Kolom yang tidak ada di Dataset A:** Umur, Lama Bekerja, Kategori, Bulan, Tahun. Semuanya dihitung dari `birth_date` dan `join_date`. Jangan minta atau simpan umur manual.

### 3.2 Dataset B — Training Record (`Training Record.csv`)
24 kolom, 5.190 baris, delimiter `;`.

`No; NIK; Nama; Jenis Kelamin; Nama PT; Department; lokasi Kerja; Group; REGION; GOL; Jabatan; Tgl; Bln; Thn; Jml Hari; Jam Pelatihan; Nama Pelatihan; Instruktur; Tempat Pelatihan; Reg / Non Reg; Keterangan; Internal/Eksternal; Level; Periode`

Pemetaan kolom ke `training_records` mengikuti migrasi starter. Kunci ke Dataset A: `NIK` = `Employee ID`.

### 3.3 Temuan kualitas data (hasil profiling — WAJIB ditangani)

| # | Temuan | Angka | Penanganan |
|---|---|---|---|
| Q1 | Tanggal tahun 2 digit | Parser standar salah abad: 35 orang "lahir 2068" | Aturan pivot di 3.4 |
| Q2 | `NIK` berisi `-` atau kosong di training | 754 dari 5.190 baris (14,5%): 689 berisi `-`, 65 kosong | Simpan `nik = NULL`, `employee_id = NULL`. Tetap dihitung di statistik pelatihan, **tidak** di analisis gabungan |
| Q3 | `NIK` terisi tetapi tidak ada di Dataset A | Sebagian besar NIK 14 digit (pekerja non-staf) memang tidak ada di employee data. | Simpan `nik` apa adanya bila rapi, `employee_id = NULL`. Lihat catatan di bawah |
| Q4 | `Nama PT` tidak baku | 151 varian setelah normalisasi; hanya 7 yang otomatis cocok dengan 44 perusahaan resmi (1.240 baris) | Tabel `company_aliases` + UI pemetaan manual (Bagian 11.3) |
| Q5 | Region training hanya beda huruf besar/kecil. Sebenarnya hanya **3 region**: Riau, Kalbar (`KALBAR`=`Kalbar`), Kaltim (`KALTIM`=`Kaltim`=`kaltim`) | 2.816 / 1.824 / 550 baris | Samakan huruf besar/kecil (mis. `strtolower` lalu kapital di awal). **Keputusan pemilik: `Kaltim` TIDAK diubah menjadi `Kubar`.** Region training tetap Riau, Kalbar, Kaltim. Konsekuensi: lihat Bagian 6 (filter region) dan 7.6 |
| Q6 | `Reg / Non Reg` 4 ejaan | Reguler, Non Reguler, NON REGULER, NOn Reguler | Normalisasi ke dua nilai |
| Q7 | `Level` training tidak seragam | workers/Workers/Middle/Senior | Kapitalisasi seragam |
| Q8 | `Tgl` berisi campuran | `Jan-31`, `19-20`, `5` | **Abaikan `Tgl`.** Pakai `Bln` + `Thn` |
| Q9 | Duplikat mencurigakan di training | 1.704 baris dengan kombinasi (NIK, Nama Pelatihan, Tgl) sama | **Jangan dihapus.** Tandai di laporan kualitas data (sebagian besar karena NIK `-`) |
| Q10 | Cakupan tahun training | 5.152 baris tahun 2026, 38 baris 2025; periode Q1–Q3 | Filter tahun wajib ada; default = tahun terbaru |
| Q11 | Grup di employee ada `PO2` dan `NON GROUP`; Region `Corp` dan `Non` | 188 dan 25 karyawan | Tampilkan apa adanya; `Corp` = kantor pusat |
| Q12 | **NIK rusak karena Excel** (notasi ilmiah) | Sebelumnya terjadi di file CSV lama akibat export lossy (angka 14 digit terpotong jadi notasi ilmiah). Sekarang menggunakan `.xlsx` asli sehingga baris rusak = 0. | HR **WAJIB** menyerahkan file `.xlsx` asli (jangan di-save ke CSV) agar aplikasi membaca *numeric value* NIK 14 digit dengan `StringValueBinder` secara utuh. NIK 14+ digit adalah SAH untuk Non-Staf. Deteksi pola `E+` tetap dipertahankan sebagai jaring pengaman. |
| Q13 | NIK non-numerik | 14 baris berisi `Promosi` | Perlakukan sebagai NIK tidak valid (`NULL`) |

**Catatan penting Q3/Q12.** Karyawan yang tidak cocok dengan data Employee mayoritas bertipe `Non Staf` (mandor panen/pemeliharaan, tenaga keamanan, trainee) yang memiliki format **NIK 14 digit** sah. Dengan menggunakan file `.xlsx` asli, aplikasi berhasil memulihkan integritas data yang sebelumnya dianggap rusak oleh CSV. Jika "training coverage" dihitung naif, angkanya (sekitar 34%) tampak rendah padahal penyebabnya adalah banyaknya pekerja non-staf yang ikut training namun tak ada di database Employee inti, bukan kurangnya pelatihan staf. Aturan di 4.6 mengatasinya. Aplikasi harus menampilkan panel **"Kualitas Data"** yang menjelaskan hal ini secara transparan.

### 3.4 Aturan parsing tanggal (kritis)
- Format sumber `dd-MMM-yy`, contoh `04-Dec-06`.
- **Birth Date:** `yy <= 15` → `20yy`, selain itu `19yy`. (Karyawan termuda lahir 2006.)
- **Join Date:** `yy <= (tahun berjalan mod 100)` → `20yy`, selain itu `19yy`.
- Validasi setelah parsing: join date tidak boleh di masa depan; join date harus ≥ birth date + 15 tahun. Data yang melanggar **tetap diimpor** tetapi dihitung di laporan "tanggal mencurigakan".
- Hasil profiling dengan aturan ini (per 28 Sep 2026): 0 pelanggaran, umur 20,5–70,6 tahun.
- Jika file sumber baru memakai tahun 4 digit, parser harus tetap bisa membacanya.

### 3.5 Kode level jabatan (hasil inferensi, perlu konfirmasi HR)
| Kode | Jabatan paling umum | HC |
|---|---|---|
| A | Driver | 91 |
| B | Trainee | 118 |
| C | Asisten Kebun | 989 |
| D | Askep Kebun | 264 |
| E | Manager Kebun | 166 |
| F | Group Manager Kebun | 59 |
| 1 | Cleaning Service | 4 |
| 2 | Pegawai Tata Usaha Sekolah | 5 |
| 3 | Guru Sekolah | 42 |
| 4 | Wakil Kepala Sarpras | 6 |
| 5 | Kepala Sekolah | 2 |

Kode 1–5 hanya muncul di **Yayasan Inti Kasih Abadi (U03)**, yaitu jalur karier sekolah. Simpan mapping ini di `config/sdm.php` (`level_labels`, `level_tracks`) supaya bisa diubah tanpa migrasi. Di grafik, level diurutkan: A, B, C, D, E, F, lalu 1–5 (kelompok "Yayasan/Sekolah") dan ditampilkan dengan label, bukan hanya kode. Kode 1–5 **dikecualikan** dari analisis "piramida jabatan perkebunan" tetapi tetap ada di total HC.

### 3.6 Nilai acuan untuk pengujian (golden numbers)
Dihitung dari data nyata dengan aturan 3.4 dan tanggal acuan **28 September 2026**. Dipakai sebagai acceptance test saat data nyata diimpor di lingkungan pengembang (test otomatis tetap memakai data sintetis).

| Metrik | Nilai |
|---|---|
| Total karyawan | 1.746 |
| Gender | Male 1.524, Female 222 |
| Rata-rata umur | 34,0 tahun |
| Rata-rata masa kerja | 6,4 tahun |
| Umur ≥ 55 | 61 orang |
| Generasi | Boomers 11, Gen X 202, Gen Y 835, Gen Z 698 |
| Employment type | PERMANENT 1.583, TRAINEE 99, PROBATION 42, CONTRACT 15, ACTING 7 |
| Region | Riau 1.022, Kalbar 334, Corp 188, Kubar 177, Non 25 |
| Jumlah perusahaan / lokasi | 44 / 92 |
| Baris training | 5.190; NIK kosong/`-`: 754; NIK rusak notasi ilmiah: 2.461; NIK rapi: 1.975 (cocok ke employee: 1.635 baris) |
| Total jam pelatihan | 158.982 |
| NIK unik terisi di training (sebelum pembersihan) | 980 (setelah NIK rusak dan `Promosi` dibuang: lebih sedikit; test penerimaan mencatat nilai barunya) |
| Karyawan yang tercatat pernah dilatih | ≈ 34% (593 orang) |

---

## 4. Definisi bisnis (satu tempat, dipakai konsisten di semua halaman)

Semua konstanta ada di `config/sdm.php`. Semua perhitungan memakai `as_of` = hari ini (bisa dioverride lewat parameter `?as_of=YYYY-MM-DD` untuk keperluan test/laporan).

### 4.1 Umur dan masa kerja
- **Umur** = selisih tahun penuh `as_of − birth_date`. **Masa kerja (LOS)** = selisih `as_of − join_date`, disajikan dalam tahun dengan 1 desimal untuk rata-rata, dan tahun penuh untuk pengelompokan.
- **Kelompok umur:** `<25`, `25–34`, `35–44`, `45–54`, `55+`.
- **Kelompok masa kerja:** `<1`, `1–<3`, `3–<5`, `5–<10`, `10+` tahun.

### 4.2 Generasi (berdasarkan tahun lahir)
| Generasi | Tahun lahir |
|---|---|
| Baby Boomers | ≤ 1964 |
| Gen X | 1965–1980 |
| Gen Y / Milenial | 1981–1996 |
| Gen Z | ≥ 1997 |

Warna tetap di semua grafik: Boomers `#94A3B8`, Gen X `#F59E0B`, Gen Y `#0EA5E9`, Gen Z `#10B981`.

### 4.3 Risiko pensiun
- Usia pensiun = `config('sdm.retirement_age')`, default **55**.
- **Berisiko pensiun** = umur ≥ usia pensiun pada `as_of`.
- **Proyeksi pensiun N tahun** = jumlah karyawan yang mencapai usia pensiun dalam `(as_of, as_of + N tahun]`. Tampilkan untuk N = 1, 3, 5, dan per tahun kalender 5 tahun ke depan.
- **Posisi terkonsentrasi risiko** = kombinasi `job_title_name` dengan ≥ 1 orang berusia ≥ (usia pensiun − 3), diurutkan jumlah.

### 4.4 Headcount (HC)
Jumlah baris `employees`. Filter mempengaruhi HC. Tidak ada status aktif/nonaktif pada data.

### 4.5 Pelatihan
- **Sesi/Baris pelatihan** = 1 baris `training_records` (satu peserta di satu pelatihan).
- **Peserta unik** = `COUNT(DISTINCT nik)` untuk NIK tidak kosong, **plus** dijelaskan bahwa baris NIK `-` tidak bisa diidentifikasi (tampilkan angka baris tanpa NIK terpisah).
- **Total jam** = `SUM(hours)`. **Rata-rata jam per peserta** = total jam baris ber-NIK ÷ peserta unik.
- **Reg / Non Reg**, **Internal / Eksternal** = pengelompokan langsung dari kolom yang sudah dinormalisasi.

### 4.6 Training coverage (definisi ketat, ini yang paling mudah salah)
`coverage = karyawan di employees yang punya ≥ 1 baris training yang ter-link (employee_id terisi) ÷ total karyawan di employees` (dalam filter aktif).
- Selalu tampilkan **dua** angka berdampingan: coverage dan **"Baris training yang tidak dapat dihubungkan ke karyawan (NIK kosong, rusak, atau tidak ada di data karyawan): X (Y%)"** dengan tooltip penjelasan (lihat catatan Q3).
- Coverage hanya dihitung pada rentang tahun pelatihan yang dipilih (default: tahun terbaru).
- Jangan pernah menyebut karyawan "belum pernah dilatih" tanpa keterangan "belum tercatat di data pelatihan".

### 4.7 Insight otomatis (berbasis template, tanpa LLM)
Kelas `App\Services\InsightBuilder` menghasilkan 3–6 kalimat Indonesia dari angka yang sudah dihitung. Template contoh:
- "{Generasi terbesar} adalah kelompok terbesar: {n} orang ({p}%)."
- "Gen Y dan Gen Z mencapai {n} orang ({p}%)."
- "{n} karyawan ({p}%) berusia {retirement_age}+ tahun; konsentrasi terbesar di level {level}."
- "Dalam 3 tahun ke depan {n} karyawan mencapai usia pensiun."
- "Rasio karyawan perempuan {p}%; terendah di level {level}."
- "Coverage pelatihan {tahun}: {p}% karyawan tercatat mengikuti minimal satu pelatihan."
Aturan: kalimat hanya muncul jika datanya cukup (mis. denominator ≥ 10), dan insight mengikuti filter aktif.

---

## 5. Arsitektur informasi

Sidebar ikon (kiri) dan navigasi utama:

1. **Ringkasan** — `/dashboard`
2. **Perusahaan** — `/perusahaan` (sebelumnya Peta Perusahaan `/peta`)
3. **Demografi & Headcount** — `/demografi`
4. **Masa Kerja & Rekrutmen** — `/masa-kerja`
5. **Risiko Pensiun** — `/pensiun`
6. **Pelatihan** — `/pelatihan`
7. **Analisis Gabungan** — `/analisis-gabungan`
8. **Direktori Karyawan** — `/karyawan`
9. **Admin** (dropdown): Import Data, Kualitas Data, Audit Log

Semua halaman kecuali Peta dan Admin memakai **FilterBar global** (Bagian 6).

---

## 6. Filter global

| Filter | Sumber | Tipe | Catatan |
|---|---|---|---|
| Region | `employees.region` | multi-select | |
| Group | `employees.group` | multi-select | |
| Perusahaan | `companies` | multi-select, searchable | Untuk `hr_company` hanya perusahaan miliknya |
| Lokasi | `locations` | multi-select, searchable | Bergantung pilihan perusahaan |
| Departemen | `employees.organization_name` | multi-select | |
| Level jabatan | `job_level_code` | multi-select | Tampil dengan label |
| Employment type | `employment_type` | multi-select | |
| Generasi | dihitung | multi-select | |
| Gender | `gender` | multi-select | |
| Periode pelatihan | `year`, `month` | tahun + rentang bulan | Hanya halaman Pelatihan/Analisis Gabungan/Ringkasan (KPI training) |

Perilaku:
- State filter ada di **query string** (`?region[]=Riau&company_id[]=12`) sehingga bisa dibagikan/bookmark dan tahan refresh.
- Filter diterapkan lewat satu class `App\Support\EmployeeFilter` dan `TrainingFilter` yang dipakai semua query. **Tidak boleh** ada halaman yang menulis logika filter sendiri.
- Filter berlaku lintas halaman (dipertahankan saat pindah halaman), kecuali Peta.
- Tombol "Reset filter" dan chip filter aktif di atas konten.
- **Filter Region bekerja di dua dunia yang berbeda.** Employee memakai Riau, Kalbar, Kubar, Corp, Non; training memakai Riau, Kalbar, Kaltim. Aturan: (a) di halaman berbasis employee (Ringkasan, Demografi, Masa Kerja, Pensiun, Peta, Direktori) dan di Analisis Gabungan, filter Region memakai `employees.region`; (b) di halaman Pelatihan (yang membaca `training_records` langsung), filter Region memakai `training_records.region` dan opsinya diambil dari nilai training. Beri keterangan kecil di UI: "Region pada data pelatihan memakai penamaan sendiri (Kaltim)." Saat filter perusahaan dipilih di halaman Pelatihan, gunakan `company_id` hasil pemetaan alias, bukan region.
- Scope role (Bagian 10) diterapkan **setelah** filter dan tidak bisa dilepas dari UI maupun query string.

---

## 7. Spesifikasi halaman

Setiap grafik harus punya: judul, tooltip, state kosong ("Tidak ada data untuk filter ini"), state loading (skeleton), dan angka berformat `id-ID`. Grafik yang berisi kelompok kecil mengikuti aturan penyamaran di 10.4.

### 7.1 Ringkasan Eksekutif (`/dashboard`)
**KPI cards (baris atas, 8 kartu):**
Total Karyawan · Rata-rata Umur · Rata-rata Masa Kerja · Risiko Pensiun (jumlah + %) · % Gen Y + Gen Z · % Perempuan · Total Jam Pelatihan · Training Coverage (dengan catatan kualitas data).

**Blok grafik:**
| Widget | Jenis | Data |
|---|---|---|
| Komposisi generasi | Donut + label persen | HC per generasi |
| Generasi per level jabatan | Stacked bar horizontal | level × generasi |
| Headcount per Region | Bar | region |
| Top 10 perusahaan | Bar horizontal | HC per perusahaan |
| Tren jam pelatihan per bulan | Line/area | `SUM(hours)` per (year, month) |
| Risiko pensiun per level | Tabel dengan heat warna | level, HC, umur ≥ pensiun, % |
| **Key Message** | Kartu teks | Keluaran `InsightBuilder` |

### 7.2 Demografi & Headcount (`/demografi`)
- HC per Group, Region, Perusahaan (bar horizontal, bisa di-sort, top 15 + "lainnya").
- Treemap HC per Departemen (`organization_name`).
- Histogram distribusi umur (bin per 5 tahun).
- Piramida umur × gender (bar terbalik kiri-kanan).
- Heatmap Generasi × Region.
- Rata-rata umur per departemen (bar, hanya departemen dengan HC ≥ 5).
- HC per level jabatan (bar berlabel).
- Gender: donut dan stacked bar gender per level.
- Marital Status: donut; PTKP: bar (proksi jumlah tanggungan).
- Tabel Top 10 `job_title_name`.
- Bar Employment Type per Region.
- Top 10 Birth Place (bar).
- **Agama tidak ditampilkan sebagai grafik** (Bagian 10.5).

### 7.3 Masa Kerja & Rekrutmen (`/masa-kerja`)
- Histogram masa kerja (kelompok 4.1).
- Line/area jumlah karyawan masuk per tahun join; toggle per bulan untuk 3 tahun terakhir.
- Bar rata-rata masa kerja per level dan per Region.
- Scatter umur vs masa kerja (titik dijitter; sorot anomali: masuk usia < 18 atau > 55).
- Heatmap tahun join × Region.
- Tabel gelombang rekrutmen: tahun, HC masuk, Employment type dominan.
- Catatan di halaman: "Turnover/resign belum dapat dianalisis karena data resign belum tersedia."

### 7.4 Risiko Pensiun (`/pensiun`)
- KPI: berisiko sekarang; pensiun ≤ 1, ≤ 3, ≤ 5 tahun.
- Bar proyeksi pensiun per tahun kalender (tahun ini s.d. +5).
- Tabel risiko per level jabatan (HC, ≥ pensiun, %, dengan heat warna) dan per departemen.
- Bar risiko per Region dan per Perusahaan (top 10).
- Tabel **Posisi terkonsentrasi risiko** (4.3): job title, jumlah berisiko, HC posisi, % — untuk perencanaan suksesi.
- Untuk role dengan akses detail: tombol "Lihat daftar karyawan" (membuka Direktori terfilter, tiap akses dicatat audit).

### 7.5 Pelatihan (`/pelatihan`)
- KPI: Total baris/sesi, Peserta unik (ber-NIK), Total jam, Rata-rata jam per peserta, Total hari pelatihan, Jumlah jenis pelatihan.
- Line tren jam dan peserta per bulan.
- Donut Reguler vs Non Reguler; Donut Internal vs Eksternal.
- Top 10 Nama Pelatihan (peserta), Top instruktur, Top tempat pelatihan.
- Jam pelatihan per Region, Group, Departemen (training), GOL (Staf/Non Staf), Level (Workers/Middle/Senior).
- Stacked bar gender × Level.
- Tabel daftar pelatihan: nama, jumlah peserta, total jam, bulan, internal/eksternal (server-side pagination, sort, search).
- Panel kualitas data: baris NIK kosong, NIK rusak, NIK tidak ditemukan, baris `Nama PT` belum terpetakan.
- Filter perusahaan di halaman ini bekerja lewat `training_records.company_id` (hasil pemetaan alias). Baris tak terpetakan **tetap dihitung di total** dan dilabeli "Belum terpetakan".

### 7.6 Analisis Gabungan (`/analisis-gabungan`)
Hanya memakai baris training yang ter-link ke karyawan (`employee_id` terisi). Tampilkan banner permanen berisi persentase cakupan link (4.6).
- Training coverage per Region, Perusahaan, Departemen, Level.
- Jam training per generasi (total dan rata-rata per karyawan generasi tersebut).
- Rata-rata jam training per level jabatan.
- Jam training per gender.
- Karyawan berisiko pensiun × jam pelatihan (tabel ringkas kelompok: 0 jam, 1–15 jam, 16+ jam).
- Karyawan masa kerja < 1 tahun yang belum tercatat pelatihan (jumlah; daftar hanya untuk role berhak).
- Scatter masa kerja vs total jam training.
- Ranking antar perusahaan (tabel): HC, rata-rata umur, coverage, jam per karyawan, % risiko pensiun. Sortable.

### 7.7 Direktori Karyawan (`/karyawan`)
- Tabel server-side: Employee ID, Nama, Perusahaan, Lokasi, Departemen, Jabatan, Level, Generasi, Umur, Masa Kerja, Employment Type. Sort, search (nama/ID/jabatan), pagination 25/50/100.
- Filter global berlaku. Klik baris membuka **Detail Karyawan** (7.9.4).
- Tombol **Export Excel** (hasil filter). Setiap export dicatat di audit log. Kolom sensitif (Religion, Marital Status, PTKP, Birth Place) hanya ikut jika role berhak.
- Export besar diproses sinkron (data kecil). Batas 5.000 baris.

### 7.8 Data Training Mentah (`/pelatihan/data`)
- Tabel server-side: NIK, Nama Peserta, Nama PT, Departemen, Lokasi Kerja, Group, Region, Golongan, Jabatan, Bulan, Tahun, Hari, Jam, Nama Pelatihan, Instruktur, Tempat, Tipe Reguler, Tipe Eksternal, Level. Sortable, search (nama/NIK/pelatihan/PT), pagination 25/50/100.
- Filter khusus yang ditambahkan ke bilah filter standar (diaktifkan saat di halaman ini): Tahun, Bulan, Golongan, Tipe Reguler, Tipe Eksternal, Level, Status NIK.
- Filter Status NIK sangat penting untuk mengurai kualitas data: `Semua`, `Terhubung (Employee ID ✓)`, `Tidak Terhubung`, `Kosong`, `Rusak (Corrupt)`, `Tidak Valid (Not Found)`.
- Jika baris memiliki `employee_id` terhubung, klik baris membuka **Detail Karyawan** (seperti pada direktori karyawan).
- Tombol **Export Excel** (hasil filter). Export menggunakan `WithCustomValueBinder` untuk memaksa NIK menjadi format teks (menghindari notasi ilmiah di Excel).

### 7.9 Galeri & Detail Perusahaan (`/perusahaan`, `/perusahaan/{kode}`) — pengganti Peta Perusahaan (Fase 10)

> [!NOTE]
> Berdasarkan keputusan pemilik sistem pada Fase 10 (13 Oktober 2026), visualisasi peta Leaflet dan kolom koordinat (`latitude`, `longitude`, `coordinate_source`) telah dihapus. Halaman Peta diganti menjadi **Galeri Perusahaan** (`/perusahaan`) dan detail perusahaan menjadi **halaman penuh** (`/perusahaan/{kode}`). Rute lama `/peta` otomatis dialihkan (*redirect 301*) ke `/perusahaan`. Widget "Distribusi Tenaga Kerja per Operasional" di Dashboard tetap dipertahankan karena menggunakan visualisasi vektor SVG statis.

#### 7.9.1 Galeri Perusahaan (`/perusahaan`)
- **Header & Filter:**
  - Kotak pencarian nama atau kode perusahaan.
  - Chip filter region berbentuk pil: Semua, Riau, Kalbar, Kubar, Corp, Non (dengan badge jumlah perusahaan per region).
  - Pilihan urutan (*sorting*): Headcount terbanyak atau Alfabetis A–Z.
  - Toggle tampilan kartu (Grid) dan tampilan baris (List).
- **Ringkasan KPI Mini (atas galeri):** Total HC, jumlah perusahaan, dan jumlah lokasi unik (92 lokasi dari tabel `locations`).
- **Kartu Perusahaan:**
  - Avatar inisial perusahaan dengan latar belakang warna sesuai region (Riau = amber, Kalbar = emerald, Kubar = blue, Corp = slate, Non = violet).
  - Nama dan kode perusahaan, tag wilayah/region.
  - Jumlah Headcount (HC) dan jumlah unit lokasi.
  - Mini bar distribusi generasi menggunakan palet warna standar (`lib/colors.js`).
  - Animasi hover halus (*elevation*).
  - Skeleton loading saat memuat data dan state kosong (*empty state*) jika pencarian tidak ditemukan.
  - Klik kartu membuka halaman detail penuh perusahaan (`/perusahaan/{kode}`).

#### 7.9.2 Detail Perusahaan (`/perusahaan/{kode}`)
- **URL Parameter:** Menggunakan kode perusahaan (kolom `companies.code`). Jika kode tidak valid menghasilkan respons 404.
- **Banner Atas:** Banner gradien warna region dengan pola siluet daun sawit, nama perusahaan, kode, region, group, jumlah lokasi, dan tombol "Kembali ke daftar".
- **Kartu KPI (4 metrik):** Headcount, Rata-rata Umur, Rata-rata Masa Kerja, dan Risiko Pensiun (55+ tahun).
- **Tab Navigasi (terekam di query parameter `?tab=profil` atau `?tab=staf`):**

##### A. Tab Profil
- **Komposisi Generasi:** Donut chart Recharts dengan warna generasi standar.
- **Level Jabatan:** Bar chart vertikal terurut standar A–F lalu 1–5.
- **Departemen:** Bar chart vertikal Top 8 departemen dengan jumlah karyawan terbanyak.
- **Ringkasan Pelatihan Perusahaan:**
  - Cakupan Pelatihan (*Coverage %*) dan rasio karyawan terlatih vs total HC.
  - Total jam pelatihan (hanya dari baris yang terhubung ke karyawan perusahaan ini).
  - Rata-rata jam pelatihan per peserta aktif.
- **Daftar Lokasi Perusahaan:** Chip interaktif unit lokasi beserta HC-nya. Klik chip lokasi akan langsung berpindah ke tab **Staf** dengan filter lokasi terpasang otomatis.
- Tombol salin grafik (*Copy as Image*) didukung pada komponen kartu grafik.

##### B. Tab Staf (SDM)
- **Pencarian & Filter Cepat:**
  - Kolom pencarian teks (nama, Employee ID, jabatan).
  - Dropdown filter cepat: Level jabatan, Departemen, dan Status Kerja (*Employment Type*).
  - Badge filter aktif dengan tombol hapus (×) individual dan tombol "Reset Filter".
- **Tabel Karyawan:** Pagination *server-side* (20 karyawan per halaman) menampilkan foto avatar / inisial, nama, Employee ID, jabatan, level, dan umur.
- **Interaksi:** Klik pada baris karyawan membuka **Detail Karyawan** ([`StaffDetailModal`](file:///d:/Dzakwan_PF/laragon-6.0-minimal/www/peta-sdm/resources/js/Components/staff/StaffDetailModal.jsx)).

#### 7.9.3 Detail Karyawan (Modal Netral `StaffDetailModal`)
Dipindahkan ke lokasi netral (`resources/js/Components/staff/StaffDetailModal.jsx`) sehingga dapat dipakai bersama oleh Galeri Perusahaan, Direktori Karyawan, dan Data Training Mentah:
1. **Identitas:** Nama, Employee ID, jabatan, level, departemen, perusahaan, lokasi, group, region, serta foto profil (lengkap dengan fitur upload & hapus foto).
2. **Data pribadi:** Gender, tempat dan tanggal lahir, umur, agama, status pernikahan, PTKP.
3. **Kepegawaian:** Tanggal masuk, masa kerja, status kepegawaian, generasi, dan perkiraan tanggal pensiun.
4. **Riwayat pelatihan:** Daftar pelatihan terhubung, bulan/tahun, jam, penyelenggara, dan sifat pelatihan (reguler/non-reguler).
- Modal **hanya-baca** untuk data identitas dan pribadi, serta mendukung unggah/hapus foto profil karyawan.
- Tutup dengan tombol X, klik latar, atau tombol Esc. Focus trap untuk aksesibilitas.

---

## 8. Arsitektur teknis

### 8.1 Stack
| Lapisan | Pilihan |
|---|---|
| Backend | Laravel (versi sesuai repo), PHP sesuai repo |
| Frontend | React + **Inertia.js** (satu project, tanpa API terpisah), Vite |
| Styling | Tailwind CSS (v4 via `@tailwindcss/vite` jika didukung; jika starter kit memakai v3, ikuti starter kit) |
| Grafik | Recharts |
| Peta | Leaflet + react-leaflet + leaflet.markercluster |
| Ikon | lucide-react |
| Excel | `maatwebsite/excel` (import via UI dan export) |
| Auth | Laravel starter kit React/Inertia (login, reset password) |
| Testing | Pest atau PHPUnit (ikuti default repo), tambah Vitest hanya bila perlu |
| DB | Ikuti `.env`. Kode harus **tidak bergantung dialek** (jangan memakai fungsi tanggal khusus MySQL/PostgreSQL di query) |

Bila starter kit resmi tidak cocok dengan versi Laravel yang terpasang, pasang Inertia + React secara manual dan catat di `ASSUMPTIONS.md`.

### 8.2 Prinsip perhitungan
Dataset kecil (±1.700 karyawan, ±5.200 baris pelatihan). Pendekatan yang diwajibkan:
- Satu query sempit ke `employees` (hanya kolom yang dibutuhkan) setelah filter + scope, lalu agregasi di PHP menggunakan Collection, **di-cache** per hash (filter + scope + as_of) selama 10 menit dengan tag/versi yang di-invalidate setiap import.
- Agregasi berat di SQL hanya untuk `training_records` (`SUM`, `COUNT DISTINCT`, `GROUP BY` yang portabel).
- Logika generasi, kelompok umur, kelompok masa kerja, risiko pensiun hidup di **satu tempat**: `App\Support\Demographics` (fungsi murni, mudah diuji). Jangan menduplikasi di controller atau di JavaScript.

### 8.3 Struktur backend
```
app/
  Console/Commands/ImportSdm.php
  Enums/Role.php
  Http/
    Controllers/
      DashboardController.php
      MapController.php
      DemographicsController.php
      TenureController.php
      RetirementController.php
      TrainingController.php
      CombinedController.php
      EmployeeController.php
      Admin/{ImportController,AliasMappingController,LocationController,
             DataQualityController,UserController,AuditLogController}.php
    Requests/{FilterRequest,ImportRequest,LocationCoordinateRequest}.php
    Middleware/EnsureRole.php
    Resources/{CompanyResource,LocationResource,EmployeeListResource,EmployeeDetailResource}.php
  Models/{User,Company,CompanyAlias,Location,Employee,TrainingRecord,AuditLog,ImportBatch}.php
  Policies/{EmployeePolicy,CompanyPolicy}.php
  Services/
    Metrics/{WorkforceMetrics,RetirementMetrics,TrainingMetrics,CombinedMetrics}.php
    InsightBuilder.php
    Import/{EmployeeImporter,TrainingImporter,ImportReport}.php
    AuditLogger.php
  Support/{Clean,Demographics,EmployeeFilter,TrainingFilter,PrivacyMasker}.php
config/sdm.php
```

### 8.4 Struktur frontend
```
resources/js/
  app.jsx
  Layouts/AppLayout.jsx           # header pill nav, sidebar ikon, slot konten
  Pages/
    Dashboard.jsx  Map.jsx  Demographics.jsx  Tenure.jsx  Retirement.jsx
    Training.jsx   Combined.jsx  Employees/Index.jsx
    Admin/{Import,AliasMapping,Locations,DataQuality,Users,AuditLog}.jsx
  Components/
    ui/{KpiCard,ChartCard,FilterBar,FilterChips,DataTable,Modal,EmptyState,Skeleton,Badge}.jsx
    charts/{DonutChart,StackedBar,HorizontalBar,LineTrend,Histogram,Heatmap,Treemap,PopulationPyramid,ScatterPlot}.jsx
    map/{SdmMap,RegionLegend,CompanyList,CompanyPanel,StaffList,StaffDetailModal}.jsx
  hooks/{useFilters,useDebounce}.js
  lib/{format.js,colors.js,constants.js}
```
Aturan: komponen grafik bersifat presentasional (menerima data siap pakai, tidak menghitung generasi/umur). Semua format angka lewat `lib/format.js` (`Intl` locale `id-ID`).

### 8.5 Rute dan endpoint
Halaman (Inertia, `GET`, middleware `auth`):

| Rute | Controller | Role |
|---|---|---|
| `/` | redirect ke `/dashboard` | semua |
| `/dashboard` | DashboardController@index | semua |
| `/peta` | MapController@index | semua |
| `/demografi`, `/masa-kerja`, `/pensiun`, `/pelatihan`, `/analisis-gabungan` | controller masing-masing | semua |
| `/karyawan` | EmployeeController@index | hr_admin, hr_company, super_admin |
| `/karyawan/export` | EmployeeController@export | idem |
| `/admin/import` | ImportController | hr_admin, super_admin |
| `/admin/pemetaan-pt` | AliasMappingController | hr_admin, super_admin |
| `/admin/lokasi` | LocationController | hr_admin, super_admin |
| `/admin/kualitas-data` | DataQualityController | hr_admin, super_admin |
| `/admin/users` | UserController | super_admin |
| `/admin/audit-log` | AuditLogController | super_admin |

Endpoint data (JSON, `web` + `auth`, dimuat lazy oleh halaman Peta):

| Endpoint | Fungsi |
|---|---|
| `GET /data/map/locations` | Semua lokasi + koordinat + HC + daftar perusahaan (dalam scope) |
| `GET /data/companies` | Daftar perusahaan + HC + region + jumlah lokasi |
| `GET /data/companies/{company}/profile` | KPI mini + agregat grafik Tab Profil |
| `GET /data/companies/{company}/employees?search=&location_id=&level=&organization_code=&employment_type=&page=` | Daftar staf (paginasi). 403 untuk `management` |
| `GET /data/employees/{employee}` | Detail karyawan + riwayat pelatihan. Wajib audit log. 403 untuk `management` |

Halaman dengan banyak widget memakai Inertia **deferred/partial props** agar KPI tampil cepat dan grafik menyusul.

### 8.6 Skema database
Basis: migrasi starter (companies, company_aliases, locations, employees, training_records). **Tambahan yang harus dibuat:**
- `users`: kolom `role` (string, enum `Role`), `is_active` (bool, default true).
- `company_user` (pivot): `user_id`, `company_id` — scope untuk `hr_company` dan `management` terbatas.
- `audit_logs`: `id`, `user_id`, `action` (`employee.view`, `employee.export`, `import.run`, `user.update`, …), `subject_type`, `subject_id`, `ip_address`, `user_agent`, `meta` (json), `created_at`. Index `(user_id, created_at)` dan `(action, created_at)`.
- `import_batches`: `id`, `user_id`, `type` (employee/training), `filename`, `rows_total`, `rows_imported`, `rows_skipped`, `warnings` (json), `started_at`, `finished_at`, `status`.
- `employees` tambahkan index `(company_id, location_id)` dan `(organization_code)`.
- Tambahkan kolom `locations.region` (nullable) bila diperlukan warna marker; jika tidak, turunkan dari mayoritas region karyawan di lokasi tsb (catatan: sebagian lokasi punya karyawan dari lebih dari satu region, hingga 3 region → pakai region terbanyak).
- Semua foreign key `training_records.company_id/employee_id` tetap **nullable**.
- `training_records`: tambahkan kolom `nik_status` (string: `ok`, `empty`, `corrupt`, `invalid`) dan `nik_raw` (string nullable, nilai asli dari sumber) supaya laporan kualitas data bisa dihitung tanpa membaca ulang CSV.

### 8.7 Import data
**Perilaku wajib (CLI dan UI memakai service yang sama):**
1. Validasi header: semua kolom wajib ada persis (toleran spasi dan huruf besar/kecil). Jika kurang, tolak dengan pesan kolom yang hilang.
2. Encoding UTF-8 (buang BOM), delimiter `;`, toleran CRLF. Kolom NIK dibaca sebagai **teks** (jangan dikonversi angka), lalu diklasifikasi `ok/empty/corrupt/invalid` (Q2, Q12, Q13).
3. **Idempoten:** menjalankan ulang file yang sama tidak menggandakan data. Employee di-upsert berdasarkan `employee_id`. Training di-*replace* per import (hapus seluruh `training_records` lalu isi ulang dalam satu transaksi), karena tidak ada kunci alami yang andal.
4. Semua dalam transaksi database; gagal = rollback total.
5. Menghasilkan `ImportReport`: baris dibaca/diimpor/dilewati, tanggal mencurigakan, NIK `-`, NIK tidak ditemukan, alias belum terpetakan, region dinormalisasi, dan daftar 20 contoh untuk tiap kategori.
6. Simpan ke `import_batches`, invalidate cache metrik, catat `audit_logs`.
7. **UI Import (`/admin/import`):** dua area unggah (Employee, Training), unggah → preview 20 baris pertama + hasil validasi header → tombol "Jalankan import" → laporan. Riwayat import di bawahnya. File disimpan di `storage/app/imports/` (bukan folder publik).
8. Import employee **tidak** menghapus karyawan yang tidak ada di file baru (belum ada konsep resign). Tampilkan peringatan jumlah karyawan di DB yang tidak muncul di file terbaru; keputusan penanganannya di OPEN_QUESTIONS.

### 8.8 Performa dan cache
- Target: halaman apa pun tampil < 2 detik (dengan cache dingin) pada dataset saat ini.
- Cache key memuat versi data (`import_batches.id` terakhir) sehingga otomatis kadaluarsa setelah import.
- Tidak boleh ada query di dalam loop; gunakan eager loading.

---

## 9. Desain visual dan UX

### 9.1 Identitas
- Font **Plus Jakarta Sans**. Warna tema:
  - `corporate-dark` `#004D40` (teal tua), `corporate-light` `#2E7D32` (hijau daun), `panel-bg` `#F8FAFC`, latar aplikasi `#F7F8FA`.
- Kartu: putih, `rounded-3xl` untuk panel besar, `rounded-2xl` untuk KPI card, bayangan halus, border `gray-100`.
- Logo perusahaan di kiri atas (aset disediakan pemilik proyek; sediakan placeholder bila belum ada). Judul aplikasi: **"Peta SDM Operasional"**.

### 9.2 Layout aplikasi
- **Header mengambang:** kiri logo + judul; tengah navigasi pill; kanan bantuan, notifikasi (boleh disembunyikan bila tidak ada fungsinya), avatar user dengan menu (profil, keluar).
- **Sidebar ikon** lebar 72 px, kartu putih rounded, ikon aktif berlatar gelap. Tooltip pada hover. Ikon bawah: pengaturan/admin.
- Konten menggulir di dalam area utama; header dan sidebar tetap.
- Responsif: ≥ 1280 px tata letak penuh; 768–1279 px grid grafik 2 kolom; < 768 px satu kolom dan sidebar menjadi menu bawah/hamburger.

### 9.3 Yang dipertahankan dari prototipe lama
Peta di kiri dengan panel 420 px di kanan; daftar perusahaan dikelompokkan per region dengan titik oranye; header panel teal dengan tombol "Kembali ke daftar"; tab Profil dan Staff; animasi `flyTo`; tooltip nama pada marker; modal detail staf lewat portal; deretan scorecard di dashboard. **Yang dibuang:** Supabase, mock data, tile Google, foto Unsplash, form edit di modal, semua field di 2.3.

### 9.4 Panduan grafik
- Tinggi grafik konsisten (mis. 280 px), legenda di bawah, sumbu berlabel, angka pada batang bila muat.
- Warna generasi tetap (4.2). Untuk kategori lain pakai palet berurutan yang ramah buta warna; jangan mengandalkan warna saja (sertakan label/angka).
- Setiap kartu grafik punya tombol menu untuk "Unduh gambar (PNG)" dan "Unduh data (CSV)" — prioritas rendah (Fase 6).

### 9.5 Aksesibilitas
Kontras teks WCAG AA, semua kontrol bisa diakses keyboard, modal menjebak fokus dan menutup dengan Esc, atribut `aria-label` pada tombol ikon, tabel memakai `<th scope>`.

---

## 10. Keamanan, privasi, dan akses

### 10.1 Autentikasi
Login email + password, reset password, throttle login, sesi aman (`SameSite=Lax`, `secure` di produksi). Tidak ada registrasi publik: user dibuat oleh `super_admin`.

### 10.2 Otorisasi (matriks)
| Kemampuan | super_admin | hr_admin | hr_company | management |
|---|:-:|:-:|:-:|:-:|
| Lihat dashboard agregat | ✔ | ✔ | ✔ (scope) | ✔ (scope) |
| Lihat peta dan profil perusahaan | ✔ | ✔ | ✔ (scope) | ✔ (scope) |
| Daftar nama staf | ✔ | ✔ | ✔ (scope) | ✘ |
| Detail pribadi karyawan | ✔ | ✔ | ✔ (scope) | ✘ |
| Export Excel | ✔ | ✔ | ✔ (scope) | ✘ |
| Import, pemetaan PT, koordinat, kualitas data | ✔ | ✔ | ✘ | ✘ |
| User dan audit log | ✔ | ✘ | ✘ | ✘ |

**Scope** = perusahaan di pivot `company_user`. User `hr_company` wajib punya ≥ 1 perusahaan; `management` tanpa perusahaan = semua perusahaan. Terapkan scope lewat satu titik (`EmployeeFilter::forUser`) sehingga tidak mungkin terlewat. Akses ke perusahaan di luar scope (ID di URL) → 404, bukan 403 (agar keberadaan data tidak bocor).

### 10.3 Audit log
Catat: pembukaan detail karyawan, export, import, perubahan user/role, perubahan koordinat lokasi, login gagal berulang. Tampilkan di `/admin/audit-log` (filter user, aksi, tanggal). Audit log tidak dapat diedit dari UI.

### 10.4 Penyamaran angka kecil (privasi)
Untuk role `management`, setiap sel agregat hasil pengelompokan dengan nilai < `config('sdm.privacy_threshold')` (default **5**) ditampilkan sebagai "<5" dan tidak digambar sebagai batang/irisan spesifik (masuk ke kategori "Lainnya"). Total keseluruhan tetap tepat. Diimplementasikan di `PrivacyMasker` pada lapisan service, **bukan** di React.

### 10.5 Data sensitif
- Agama, status pernikahan, PTKP, tempat lahir: tampil **hanya** di detail karyawan dan export untuk role berhak. Agama **tidak** dibuatkan grafik/agregat.
- PTKP berkaitan dengan data pajak; perlakukan setara data sensitif.
- Tanggal lahir lengkap hanya di detail; di daftar cukup umur.
- Aplikasi wajib berjalan di HTTPS pada produksi. `APP_DEBUG=false` di produksi.

### 10.6 Kebersihan repo dan rahasia
- `.gitignore` mencakup `storage/app/imports/`, `*.csv` di root, `.env`.
- Tidak ada kredensial, kunci API, atau data nyata di repo, test, seeder, atau dokumentasi.
- Sediakan `.env.example` yang lengkap (termasuk `VITE_MAP_TILE_URL`, `VITE_MAP_ATTRIBUTION`).

---

## 11. Modul admin

### 11.1 Import Data — lihat 8.7.

### 11.2 Koordinat Lokasi (`/admin/lokasi`)
- Tabel 92 lokasi: kode, nama, HC, perusahaan, koordinat (lat/lng), status (ada/belum).
- Edit koordinat lewat input angka **dan** lewat klik pada peta mini untuk menaruh pin. Validasi: latitude −11…6, longitude 95…141 (batas Indonesia, peringatan bila di luar).
- Impor massal koordinat dari CSV (`code;latitude;longitude`) dengan preview.
- Filter "hanya yang belum punya koordinat". Perubahan dicatat di audit log.
- Field opsional `facility_type` (Kebun / Pabrik / Kantor / Lainnya) untuk ikon marker.

### 11.3 Pemetaan Nama PT (`/admin/pemetaan-pt`)
- Tabel alias hasil import: alias, jumlah baris training, perusahaan terpetakan (dropdown searchable dari 44 perusahaan), status.
- Diurutkan berdasarkan jumlah baris menurun agar 20 alias teratas menutup sebagian besar data. Filter "belum terpetakan".
- Saran otomatis: kecocokan dengan nama lokasi atau nama perusahaan (pencocokan mirip/fuzzy sederhana) ditampilkan sebagai saran, **bukan** diterapkan otomatis.
- Simpan → langsung memperbarui `training_records.company_id` untuk alias itu. Ada tombol "Hitung ulang" dan indikator progres pemetaan (% baris terpetakan).
- Catatan untuk implementator: banyak alias di training berupa singkatan lokasi/estate (contoh: `PSG`, `SAM1`, `SAM2`, `PSA`, `CLP`, `GSI`, `BDL`) yang juga muncul sebagai **Location Name** di data employee. Pemetaan lokasi → perusahaan dapat diturunkan dari data employee dan dijadikan saran utama.

### 11.4 Kualitas Data (`/admin/kualitas-data`)
Kartu dan tabel dari import terakhir: tanggal mencurigakan, employee tanpa lokasi berkoordinat, NIK `-`, NIK tak ditemukan, alias belum terpetakan, duplikat training, nilai region dinormalisasi, level jabatan tanpa label. Tiap kartu menjelaskan arti dan tindakan yang disarankan, dengan contoh baris (tanpa data pribadi berlebih: tampilkan Employee ID/NIK saja).

### 11.5 User & Akses (`/admin/users`)
CRUD user, atur role, assign perusahaan, nonaktifkan user, kirim ulang tautan reset password. Tidak boleh menghapus super_admin terakhir.

---

## 12. Kebutuhan non-fungsional
| Area | Kebutuhan |
|---|---|
| Kinerja | Halaman < 2 dtk (cache dingin), < 500 ms (cache hangat); tabel besar selalu server-side pagination |
| Keandalan | Import atomik; kegagalan tidak merusak data lama |
| Keamanan | OWASP dasar: proteksi CSRF, validasi input, query berparameter, escape output, header keamanan, rate limit login dan export |
| Observabilitas | Log error terstruktur; log import; tidak mencatat data pribadi di log aplikasi |
| Kompatibilitas | Chrome, Edge, Firefox, Safari versi terbaru; layar 1280 px sebagai target utama |
| Lokalisasi | Bahasa Indonesia, `id-ID`, zona `Asia/Jakarta` |
| Pemeliharaan | Aturan bisnis hanya di `config/sdm.php` dan `Demographics`; README lengkap |

---

## 13. Strategi pengujian

**Wajib otomatis (data sintetis, `Carbon::setTestNow('2026-09-28')`):**
1. `Clean`: parsing tanggal 2 digit (batas pivot 15 dan tahun berjalan), NIK `-`, normalisasi region, reguler, level, kunci nama PT.
2. `Demographics`: batas generasi (1964/1965, 1980/1981, 1996/1997), kelompok umur dan masa kerja pada nilai batas, risiko pensiun tepat pada ulang tahun ke-55.
3. `EmployeeFilter` dan scope role: `hr_company` tidak bisa melihat perusahaan lain lewat query string maupun ID di URL (harus 404).
4. Otorisasi: `management` menerima 403 pada endpoint staf/detail/export; `hr_company` menerima 404 untuk perusahaan lain.
5. `PrivacyMasker`: sel < 5 disamarkan untuk `management`, tidak untuk `hr_admin`.
6. Import: header salah ditolak, idempoten (dua kali import = jumlah baris sama), rollback saat error, laporan menghitung kategori kualitas dengan benar.
7. `TrainingMetrics` dan `CombinedMetrics`: peserta unik, rata-rata jam, coverage (definisi 4.6) pada fixture kecil dengan jawaban yang dihitung tangan.
8. `InsightBuilder`: kalimat muncul/tidak sesuai ambang data.
9. Audit log tercatat saat detail karyawan dibuka dan saat export.

**Tes penerimaan manual dengan data nyata** (lokal, bukan di CI): cocokkan seluruh nilai di 3.6. Selisih rata-rata umur/masa kerja > 0,1 harus dijelaskan (biasanya tanggal acuan berbeda).

**Frontend:** `npm run build` tanpa error, `eslint` bersih, semua halaman dapat dibuka tanpa error konsol, state kosong dan state loading terverifikasi.

---

## 14. Rencana pengerjaan per fase

Setiap fase punya *Definition of Done* (DoD). Jangan mulai fase berikutnya sebelum DoD terpenuhi.

### Fase 0 — Fondasi (frontend, auth, layout)
Tugas:
- Pasang Inertia + React + Tailwind + Vite; pasang recharts, leaflet, react-leaflet, leaflet.markercluster, lucide-react, maatwebsite/excel.
- Auth (starter kit), enum `Role`, middleware `EnsureRole`, pivot `company_user`, seeder user demo (role masing-masing, password dari env).
- `config/sdm.php` (usia pensiun, batas generasi, kelompok umur/LOS, label level, ambang privasi, nama app).
- `AppLayout` (header pill, sidebar ikon, tema), `FilterBar` kerangka, komponen `ui/*` dasar, `lib/format.js`.
- `.gitignore`, `.env.example`, `docs/ASSUMPTIONS.md`, `docs/OPEN_QUESTIONS.md`.

DoD: login berfungsi; empat role terbedakan; layout tampil di semua ukuran layar; halaman placeholder untuk semua rute; build lolos.

### Fase 1 — Lapisan data
Tugas: review dan perbaiki migrasi/`Clean`/`ImportSdm` starter; tambah tabel `audit_logs`, `import_batches`; `ImportReport`; service `EmployeeImporter`/`TrainingImporter`; perintah CLI; unit test `Clean` dan `Demographics`; `EmployeeFilter`/`TrainingFilter`; halaman Import dan Kualitas Data dasar.

DoD: import data nyata berhasil di lokal; semua angka di 3.6 cocok; test hijau; laporan kualitas data sesuai temuan 3.3.

### Fase 2 — Peta Perusahaan
Tugas: admin Koordinat Lokasi (termasuk impor CSV); endpoint `/data/*`; `SdmMap`, `CompanyList`, `CompanyPanel`, `StaffList`, `StaffDetailModal`; audit log pada detail; penyamaran dan scope; responsif (bottom sheet).

DoD: kriteria penerimaan 7.8 seluruhnya terpenuhi; `hr_company` hanya melihat perusahaannya; `management` tidak melihat tab Staff; tile bukan Google.

### Fase 3 — Ringkasan dan Demografi
Tugas: `WorkforceMetrics`, `InsightBuilder`, FilterBar penuh dengan sinkronisasi query string, halaman 7.1 dan 7.2, cache dan invalidasi.

DoD: KPI dan grafik cocok dengan 3.6; filter mengubah seluruh widget; Key Message benar dan mengikuti filter.

### Fase 4 — Masa Kerja dan Risiko Pensiun
Tugas: `RetirementMetrics`, halaman 7.3 dan 7.4, daftar posisi terkonsentrasi risiko, tautan ke Direktori.

DoD: angka pensiun cocok (61 berisiko); proyeksi 1/3/5 tahun teruji di unit test dengan batas ulang tahun.

### Fase 5 — Pelatihan dan Analisis Gabungan
Tugas: admin Pemetaan Nama PT; `TrainingMetrics`, `CombinedMetrics`; halaman 7.5 dan 7.6; banner kualitas data dan catatan coverage.

DoD: total jam 158.982; peserta unik 980; coverage ditampilkan bersama angka baris tak terhubung; alias tak terpetakan tetap muncul sebagai "Belum terpetakan".

### Fase 6 — Direktori, export, penyelesaian
Tugas: Direktori Karyawan, export Excel (dengan audit), manajemen user, halaman audit log, unduh PNG/CSV grafik (opsional), aksesibilitas, optimasi, README (instalasi, import, peran, deploy), skrip deploy dasar.

DoD: seluruh pengujian di Bagian 13 lulus; README memungkinkan orang lain menjalankan proyek dari nol.

---

## 15. Risiko dan ketergantungan
| Risiko | Dampak | Mitigasi |
|---|---|---|
| 47% baris training punya NIK rusak (notasi ilmiah Excel) dan 14,5% tanpa NIK | Coverage rendah/menyesatkan; analisis gabungan hanya mencakup ±38% baris | Definisi 4.6, banner, panel kualitas data, **minta HR mengekspor ulang Training Record dengan kolom NIK berformat Teks** |
| 76% baris training tidak otomatis terpetakan ke perusahaan | Filter perusahaan di halaman Pelatihan tidak lengkap | UI pemetaan alias + saran otomatis; label "Belum terpetakan" |
| Koordinat lokasi belum ada (92 lokasi) | Peta kosong | Modul koordinat + impor CSV; peta tetap berfungsi parsial; daftar panel tidak bergantung koordinat |
| Tahun 2 digit | Umur/generasi salah | Aturan pivot 3.4 dan unit test |
| Kebocoran data pribadi | Risiko hukum dan reputasi | Bagian 10, `.gitignore`, audit log, role |
| Batas generasi dan usia pensiun berbeda dengan kebijakan | Angka dipertanyakan | Semua di `config/sdm.php` dan tercantum di UI sebagai catatan kaki definisi |

## 16. Pertanyaan terbuka (catat di `docs/OPEN_QUESTIONS.md`, ambil default yang tertulis)
1. Apakah usia pensiun kebijakan perusahaan = 55? *(default 55, konfigurabel)*
2. ~~Apakah `Kaltim` (training) = `Kubar` (employee)?~~ **Diputuskan pemilik: dibiarkan terpisah** (`Kaltim` tetap `Kaltim`). Bila kelak ingin digabung, ubah `Clean::region()` dan import ulang.
3. Arti pasti kode level A–F dan 1–5. *(default: tabel 3.5)*
4. Bisakah HR mengekspor ulang Training Record dengan NIK berformat Teks (14 digit non-staf tidak rusak)? Apakah export employee akan dilengkapi non-staf yang NIK-nya 14 digit? *(default: tampilkan apa adanya dengan banner kualitas data)*
5. Karyawan yang hilang dari file employee terbaru: dianggap resign atau dibiarkan? *(default: dibiarkan, dengan peringatan)*
6. Apakah `hr_company` boleh melihat lebih dari satu perusahaan? *(default: ya, lewat pivot)*
7. Apakah manajemen boleh melihat nama staf pada level tertentu (mis. Manager ke atas)? *(default: tidak)*
8. Apakah ada kebijakan retensi audit log? *(default: simpan 24 bulan)*
9. Apakah aplikasi di-host di server internal atau cloud? *(default: tidak mempengaruhi kode; siapkan README deploy generik)*
10. Sumber logo dan panduan merek resmi. *(default: placeholder teks)*

## 17. Definisi selesai (keseluruhan)
Seluruh fase memenuhi DoD-nya; nilai acuan 3.6 cocok; matriks akses 10.2 terverifikasi lewat test; tidak ada data nyata atau kredensial di repo; `npm run build` dan seluruh test hijau; README dan dokumen asumsi/pertanyaan terbuka lengkap.

---

## Lampiran A — Daftar 44 perusahaan (dari Dataset A)

Dipakai untuk memeriksa hasil import. Jangan di-hardcode di aplikasi; data perusahaan berasal dari import.

| Kode | Nama Perusahaan | Region | Group | HC | Lokasi |
|---|---|---|---|---:|---:|
| B01 | PT. Borneo Ketapang Permai | Kalbar | FR | 17 | 2 |
| B03 | PT. Limpah Sejahtera | Kalbar | FR | 63 | 4 |
| B04 | PT. Mitra Karya Sentosa | Kalbar | FR | 80 | 6 |
| B05 | PT. Pulau Tiga Lestari Jaya | Kalbar | FR | 11 | 2 |
| B06 | PT. Umekah Sari Pratama | Kalbar | FR | 55 | 3 |
| B07 | PT. Swadaya Mukti Prakarsa | Kalbar | FR | 79 | 5 |
| B08 | PT. Falcon Agri Persada | Kalbar | FR | 29 | 2 |
| B10 | PT. Kayung Agro Lestari | Corp | PO2 | 34 | 2 |
| J04 | PT. Jelajah Lautan Nusantara | Non | NON GROUP | 1 | 1 |
| J05 | PT. Bina Maritim Sejati | Non | NON GROUP | 13 | 1 |
| L01 | PT. Austindo Aufwind New Energy | Corp | PO2 | 1 | 1 |
| L02 | PT. Sahabat Mewah & Makmur | Corp | PO2 | 41 | 2 |
| R01 | PT. Arindo Trisejahtera | Riau | FR | 38 | 5 |
| R02 | PT. Bumi Sawit Perkasa | Riau | FR | 21 | 3 |
| R03 | PT. Ciliandra Perkasa | Riau | FR | 73 | 5 |
| R04 | PT. Matthew Air Nusantara | Riau | FR | 13 | 1 |
| R05 | PT. Meridan Sejati Surya Plantation | Riau | FR | 74 | 5 |
| R06 | PT. Muriniwood Indah Industry | Riau | FR | 70 | 4 |
| R07 | PT. Panca Surya Agrindo | Riau | FR | 83 | 4 |
| R08 | PT. Panca Surya Garden | Riau | FR | 153 | 4 |
| R09 | PT. Perdana Inti Sawit Perkasa | Riau | FR | 72 | 6 |
| R10 | PT. Priatama Riau | Riau | FR | 14 | 2 |
| R11 | PT. Subur Arum Makmur | Riau | FR | 116 | 6 |
| R12 | PT. Surya Dumai Agrindo | Riau | FR | 24 | 4 |
| R13 | PT. Surya Intisari Raya | Riau | FR | 49 | 5 |
| R14 | PT. Setia Agrindo Mandiri | Riau | FR | 23 | 3 |
| R15 | PT. Setia Agrindo Lestari | Riau | FR | 6 | 2 |
| R16 | PT. Indogreen Jaya Abadi | Riau | FR | 7 | 2 |
| R17 | PT. Gerbang Sawit Indah | Riau | FR | 13 | 2 |
| R18 | PT. Adhitya Serayakorita | Riau | FR | 119 | 6 |
| R20 | PT. Citra Palma Kencana | Riau | FR | 8 | 2 |
| R21 | PT. Karya Tama Bakti Mulia | Riau | FR | 39 | 7 |
| R22 | PT. Masuba Citra Mandiri | Riau | FR | 7 | 1 |
| T09 | PT. Citra Agro Kencana | Kubar | FR | 88 | 6 |
| T10 | PT. Ketapang Agro Lestari | Kubar | FR | 42 | 4 |
| T11 | PT. BorneoPersada Energi Jaya | Kubar | FR | 4 | 1 |
| T12 | PT. BorneoSurya Mining Jaya | Kubar | FR | 10 | 1 |
| T13 | PT. BorneoPersada Prima Jaya | Kubar | FR | 10 | 1 |
| T14 | PT. Maha Karya Bersama | Kubar | FR | 9 | 1 |
| T15 | PT. Borneo Damai Lestari | Kubar | FR | 14 | 2 |
| T16 | PT. Fangiono Perkasa Sejati | Non | NON GROUP | 11 | 1 |
| U01 | PT. Austindo Nusantara Jaya Agri | Corp | PO2 | 29 | 2 |
| U02 | PT. Austindo Nusantara Jaya Agri Siais | Corp | PO2 | 24 | 2 |
| U03 | Yayasan Inti Kasih Abadi | Corp | PO2 | 59 | 2 |

## Lampiran B — 25 alias `Nama PT` terbesar yang belum otomatis cocok

Dari 151 alias (setelah normalisasi), hanya 7 yang otomatis cocok dengan 44 perusahaan resmi. Contoh di bawah menunjukkan mengapa UI pemetaan (11.3) dibutuhkan. Kolom terakhir menunjukkan alias yang sama dengan nama lokasi di data employee, yang bisa dipakai sebagai saran pemetaan.

| Alias (ternormalisasi) | Baris training | Sama dengan nama lokasi di employee? |
|---|---:|:-:|
| PSG | 535 | ya |
| MITRA KARYA SENTOSA SANGGAU | 202 | tidak |
| SAM2 | 198 | ya |
| MITRA KARYA SENTOSA KETAPANG | 172 | tidak |
| PSA | 168 | ya |
| SAGM | 159 | ya |
| MII | 146 | ya |
| SAM1 | 139 | ya |
| SMM | 138 | tidak |
| CLP | 122 | ya |
| CAKM | 119 | tidak |
| MSSP1 | 96 | tidak |
| GSI | 91 | ya |
| PISP2 | 91 | ya |
| BDL | 88 | ya |
| ATS2 | 88 | ya |
| ATS1 | 82 | ya |
| SIR LUKUT | 81 | tidak |
| CAKB | 77 | tidak |
| KAL | 76 | ya |
| BPPJ | 64 | ya |
| SAL | 52 | ya |
| PISP1 | 49 | ya |
| BSP | 46 | ya |
| SDA | 39 | tidak |

## Lampiran C — Pemetaan kolom training ke database

| Kolom sumber | Kolom DB | Normalisasi |
|---|---|---|
| NIK | `nik`, `nik_raw`, `nik_status`, `employee_id` | `Clean::nikStatus` (ok/empty/corrupt/invalid); `employee_id` diisi bila NIK ok dan ada di employee |
| Nama | `participant_name` | trim |
| Jenis Kelamin | `gender` | trim |
| Nama PT | `company_name_raw`, `company_id` | kunci via `Clean::companyKey`, lalu `company_aliases` |
| Department | `department` | trim (25 nilai unik) |
| lokasi Kerja | `work_location` | trim |
| Group | `group` | trim |
| REGION | `region` | `Clean::region` (hanya menyamakan huruf besar/kecil; Kaltim tetap Kaltim) |
| GOL | `grade` | Staf / Non Staf |
| Jabatan | `position` | trim |
| Tgl | *(diabaikan)* | campuran format |
| Bln, Thn | `month`, `year` | `Clean::month`; baris tanpa bulan/tahun dilewati |
| Jml Hari | `days` | numerik |
| Jam Pelatihan | `hours` | numerik |
| Nama Pelatihan | `training_name` | trim (41 nilai unik) |
| Instruktur | `instructor` | trim |
| Tempat Pelatihan | `venue` | trim |
| Reg / Non Reg | `regularity` | `Clean::regularity` |
| Keterangan | `note` | trim |
| Internal/Eksternal | `source_type` | trim |
| Level | `level` | `Clean::level` |
| Periode | `period` | Q1–Q4 |

## Lampiran D — Glosarium
**HC** headcount. **LOS** length of service (masa kerja). **NIK** nomor induk karyawan (di training) = **Employee ID** (di employee). **PTKP** penghasilan tidak kena pajak (kode status tanggungan). **GOL** golongan (Staf / Non Staf pada data training). **Coverage** proporsi karyawan yang tercatat mengikuti pelatihan (definisi 4.6). **Alias** nama PT versi data training yang dipetakan ke perusahaan resmi.

