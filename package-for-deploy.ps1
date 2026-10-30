# Script Otomatis Packaging / Zipping Monitoring Operations (Peta SDM) untuk Tim IT Jakarta
# Jalankan di PowerShell: .\package-for-deploy.ps1
param(
    [switch]$IncludeVendor = $false
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  MENYIAPKAN PAKET DEPLOY MONITORING OPERATIONS           " -ForegroundColor Cyan
Write-Host "  Domain Target : https://monitoringops-academy.first-resources.com" -ForegroundColor DarkCyan
Write-Host "  API Portal    : https://academy.first-resources.com     " -ForegroundColor DarkCyan
Write-Host "==========================================================" -ForegroundColor Cyan

$sourceDir = $PSScriptRoot
$timestamp = Get-Date -Format 'yyyyMMdd-HHmm'
$zipFileName = if ($IncludeVendor) {
    "monitoringops-peta-sdm-release-with-vendor-$timestamp.zip"
} else {
    "monitoringops-peta-sdm-release-$timestamp.zip"
}
$zipPath = Join-Path $sourceDir $zipFileName
$stagingDir = Join-Path $env:TEMP "monitoringops-staging-$(Get-Random)"

Write-Host "`n[1/6] Membersihkan cache lokal Laravel..." -ForegroundColor Yellow
php artisan optimize:clear

Write-Host "`n[2/6] Memastikan build frontend production terbaru (Vite/React)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build frontend gagal! Pembungkusan dibatalkan." -ForegroundColor Red
    exit 1
}

Write-Host "`n[3/6] Memperbarui dump database (database_peta_sdm_initial.sql)..." -ForegroundColor Yellow
$sqlFile = Join-Path $sourceDir "database_peta_sdm_initial.sql"
mysqldump -u root --default-character-set=utf8mb4 --single-transaction --quick db_peta --result-file=$sqlFile
if (Test-Path $sqlFile) {
    $sqlSize = [math]::Round((Get-Item $sqlFile).Length / 1MB, 2)
    Write-Host "  > Database dump berhasil diexport ($sqlSize MB)" -ForegroundColor Green
} else {
    Write-Host "  > Peringatan: mysqldump gagal atau tidak ditemukan. Menggunakan dump database sebelumnya jika ada." -ForegroundColor Yellow
}

Write-Host "`n[4/6] Menyiapkan struktur berkas ke direktori staging..." -ForegroundColor Yellow
if (Test-Path $stagingDir) { Remove-Item -Recurse -Force $stagingDir }
New-Item -ItemType Directory -Path $stagingDir | Out-Null

# Folder yang disertakan
$includeDirs = @("app", "bootstrap", "config", "database", "public", "resources", "routes", "storage")
if ($IncludeVendor -and (Test-Path (Join-Path $sourceDir "vendor"))) {
    $includeDirs += "vendor"
    Write-Host "  > Menyertakan folder vendor..." -ForegroundColor DarkGray
}

foreach ($dir in $includeDirs) {
    $src = Join-Path $sourceDir $dir
    if (Test-Path $src) {
        $dest = Join-Path $stagingDir $dir
        Copy-Item -Path $src -Destination $dest -Recurse -Force
    }
}

# Berkas root yang disertakan
$includeFiles = @(
    "artisan",
    "composer.json",
    "composer.lock",
    "package.json",
    ".env.example",
    "PANDUAN_DEPLOY_IT_JAKARTA.md",
    "database_peta_sdm_initial.sql"
)
foreach ($file in $includeFiles) {
    $src = Join-Path $sourceDir $file
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination (Join-Path $stagingDir $file) -Force
    }
}

# Hapus public/storage di staging agar tidak merusak symlink pada server Linux
$stagingPublicStorage = Join-Path $stagingDir "public\storage"
if (Test-Path $stagingPublicStorage) {
    Remove-Item -Recurse -Force $stagingPublicStorage -ErrorAction SilentlyContinue
}

# Bersihkan file log & cache temporary di staging storage
$stagingStorage = Join-Path $stagingDir "storage"
if (Test-Path $stagingStorage) {
    Get-ChildItem -Path "$stagingStorage\logs" -File -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path "$stagingStorage\framework\cache\data" -File -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path "$stagingStorage\framework\sessions" -File -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path "$stagingStorage\framework\views" -File -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path "$stagingStorage\backups" -File -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
    if (Test-Path "$stagingStorage\app\public\employees.zip") {
        Remove-Item -Force "$stagingStorage\app\public\employees.zip" -ErrorAction SilentlyContinue
    }

    # Pastikan file .gitignore tetap ada agar direktori tidak hilang saat di-unzip
    $storageGitIgnores = @(
        "$stagingStorage\.gitignore",
        "$stagingStorage\app\.gitignore",
        "$stagingStorage\app\public\.gitignore",
        "$stagingStorage\framework\.gitignore",
        "$stagingStorage\framework\cache\.gitignore",
        "$stagingStorage\framework\sessions\.gitignore",
        "$stagingStorage\framework\views\.gitignore",
        "$stagingStorage\logs\.gitignore"
    )
    foreach ($gi in $storageGitIgnores) {
        $parent = Split-Path $gi -Parent
        if (Test-Path $parent) {
            if (-not (Test-Path $gi)) {
                "*`n!.gitignore`n" | Set-Content -Path $gi -Force
            }
        }
    }
}

# Bersihkan file temporary di staging bootstrap/cache (kecuali .gitignore)
$stagingBootstrapCache = Join-Path $stagingDir "bootstrap\cache"
if (Test-Path $stagingBootstrapCache) {
    Get-ChildItem -Path $stagingBootstrapCache -File | Where-Object { $_.Name -ne ".gitignore" } | Remove-Item -Force -ErrorAction SilentlyContinue
    $bcGi = Join-Path $stagingBootstrapCache ".gitignore"
    if (-not (Test-Path $bcGi)) {
        "*`n!.gitignore`n" | Set-Content -Path $bcGi -Force
    }
}

Write-Host "`n[5/6] Mengompres seluruh berkas menjadi ZIP: $zipFileName..." -ForegroundColor Yellow
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }

# Gunakan tar bawaan Windows untuk kompresi zip super cepat
$prevLoc = Get-Location
Set-Location $stagingDir
tar -a -cf $zipPath *
Set-Location $prevLoc

Write-Host "`n[6/6] Membersihkan direktori temporary staging..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $stagingDir

$fileSizeMb = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  SUKSES! PAKET DEPLOYMENT SIAP DISERAHKAN KE IT JAKARTA  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  File ZIP : $zipPath" -ForegroundColor White
Write-Host "  Ukuran   : $fileSizeMb MB" -ForegroundColor White
Write-Host "  Panduan  : PANDUAN_DEPLOY_IT_JAKARTA.md (tersedia di dalam ZIP)" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
