import { useState, useRef, useMemo, useEffect } from 'react';
import { useForm, usePage, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { InfoTooltip } from '@/Components/ui/InfoTooltip';
import { 
    UploadCloud, 
    RefreshCw, 
    FileSpreadsheet, 
    Layers, 
    ShieldCheck, 
    CheckCircle2, 
    AlertTriangle, 
    XCircle, 
    Clock, 
    Database, 
    Users, 
    GraduationCap, 
    Search, 
    X, 
    Calendar, 
    Play, 
    FileUp, 
    ArrowRight,
    Check,
    AlertCircle,
    Info,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

function formatDateTime(dateString) {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateString;
    }
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function Import() {
    const { batches = [], portalSyncConfig } = usePage().props;
    const [isDragging, setIsDragging] = useState(false);
    const [tableFilter, setTableFilter] = useState('all'); // all | portal | manual
    const [searchQuery, setSearchQuery] = useState('');
    const [perPage, setPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    const fileInputRef = useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'employee',
        file: null,
    });

    const { post: postSync, processing: syncProcessing, errors: syncErrors } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post('/admin/import', {
            onSuccess: () => {
                reset('file');
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    const handlePortalSync = (dryRun = false) => {
        const message = dryRun
            ? 'Jalankan simulasi (dry-run) penarikan data dari portal?\n\nKoneksi dan pemetaan data akan diuji tanpa mengubah database.'
            : 'Data training saat ini akan diganti dengan data snapshot terbaru dari portal resmi FR Academy.\n\nLanjutkan sinkronisasi?';

        if (window.confirm(message)) {
            postSync('/admin/import/portal-sync', {
                data: { dry_run: dryRun },
                preserveScroll: true,
            });
        }
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setData('file', e.dataTransfer.files[0]);
        }
    };

    // Cari batch sync portal terakhir
    const lastPortalBatch = batches?.find((b) => b.filename && b.filename.includes('Portal API'));
    const successfulBatches = batches?.filter((b) => b.status === 'completed').length || 0;
    
    // Hitung total peringatan
    const getWarningCount = (batch) => {
        if (!batch || !batch.warnings) return 0;
        const w = typeof batch.warnings === 'string' ? JSON.parse(batch.warnings) : batch.warnings;
        if (typeof w !== 'object' || w === null) return 0;
        return Object.values(w).reduce((acc, curr) => acc + (curr?.count || 0), 0);
    };

    const getBatchErrorReason = (batch) => {
        if (!batch || !batch.warnings) return null;
        const w = typeof batch.warnings === 'string' ? JSON.parse(batch.warnings) : batch.warnings;
        return w?.error || null;
    };

    const isScheduledBatch = (batch) => batch?.filename?.includes('terjadwal');
    const isDryRunBatch = (batch) => batch?.filename?.includes('dry-run');

    // Filter batches untuk tabel
    const filteredBatches = useMemo(() => {
        if (!batches) return [];
        return batches.filter((b) => {
            const isPortal = b.filename && b.filename.includes('Portal API');
            if (tableFilter === 'portal' && !isPortal) return false;
            if (tableFilter === 'manual' && isPortal) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const fn = (b.filename || '').toLowerCase();
                const type = (b.type || '').toLowerCase();
                const id = String(b.id);
                if (!fn.includes(q) && !type.includes(q) && !id.includes(q)) return false;
            }
            return true;
        });
    }, [batches, tableFilter, searchQuery]);

    // Reset halaman saat filter, pencarian, atau jumlah baris per halaman berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [tableFilter, searchQuery, perPage]);

    const totalFiltered = filteredBatches.length;
    const totalPages = Math.ceil(totalFiltered / perPage) || 1;
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, totalFiltered);
    const paginatedBatches = filteredBatches.slice(startIndex, endIndex);

    const portalBatchCount = batches?.filter((b) => b.filename && b.filename.includes('Portal API')).length || 0;
    const manualBatchCount = (batches?.length || 0) - portalBatchCount;

    return (
        <AppLayout title="Import & Sinkronisasi">
            <Head title="Import & Sinkronisasi Data" />

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Import &amp; Sinkronisasi Data</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Pusat kendali integrasi data otomatis dari Portal FR Academy dan pembaruan berkas master operasional.
                    </p>
                </div>
                
                <div className="flex items-center gap-2">
                    <Link
                        href="/admin/kualitas-data"
                        className="inline-flex items-center px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs"
                    >
                        <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
                        Kualitas Data
                    </Link>
                    <Link
                        href="/pelatihan/data"
                        className="inline-flex items-center px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs"
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-1.5 text-gray-500" />
                        Tabel Pelatihan
                    </Link>
                </div>
            </div>

            {/* 4 Executive Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Status Integrasi */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between relative hover:z-40 focus-within:z-40">
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Integrasi Portal</span>
                            <InfoTooltip title="Integrasi Portal" text="Status sinkronisasi data pelatihan otomatis terjadwal dari Portal FR Academy." />
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                            <RefreshCw className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-gray-900 flex items-center gap-2">
                            <span>{portalSyncConfig?.enabled ? 'Otomatis Aktif' : 'Standby'}</span>
                            <span className={`w-2.5 h-2.5 rounded-full ${portalSyncConfig?.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            Jadwal: {portalSyncConfig?.enabled ? `Setiap ${portalSyncConfig?.time || '02:00'} WIB` : 'Manual'}
                        </div>
                    </div>
                </div>

                {/* Hasil Sync Terakhir */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between relative hover:z-40 focus-within:z-40">
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Sync Terakhir</span>
                            <InfoTooltip title="Hasil Sync Terakhir" text="Status dan waktu penarikan data paling mutakhir dari Portal FR Academy." />
                        </div>
                        <div className={`p-2 rounded-xl ${
                            !lastPortalBatch ? 'bg-slate-100 text-slate-700' :
                            lastPortalBatch.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-gray-900">
                            {!lastPortalBatch ? 'Belum Ada' : lastPortalBatch.status === 'completed' ? 'Sukses' : 'Gagal'}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 truncate" title={lastPortalBatch ? formatDateTime(lastPortalBatch.started_at) : '-'}>
                            {lastPortalBatch ? formatDateTime(lastPortalBatch.started_at) : 'Belum pernah sync'}
                        </div>
                    </div>
                </div>

                {/* Baris Diimpor Terkini */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between relative hover:z-40 focus-within:z-40">
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Rekam Pelatihan</span>
                            <InfoTooltip title="Rekam Pelatihan" text="Jumlah data pelatihan hasil penarikan portal terakhir yang berhasil disimpan ke database." />
                        </div>
                        <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-gray-900">
                            {lastPortalBatch?.rows_imported ? lastPortalBatch.rows_imported.toLocaleString('id-ID') : '0'}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            Dari total {lastPortalBatch?.rows_total?.toLocaleString('id-ID') || 0} baris rekam
                        </div>
                    </div>
                </div>

                {/* Total Riwayat Batch */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between relative hover:z-40 focus-within:z-40">
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Riwayat Batch</span>
                            <InfoTooltip title="Riwayat Batch" text="Total log proses sinkronisasi dan import berkas yang tersimpan di sistem." />
                        </div>
                        <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                            <Layers className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-gray-900">
                            {batches?.length || 0} <span className="text-xs font-semibold text-gray-500 uppercase tracking-normal">Batch</span>
                        </div>
                        <div className="mt-1 text-xs text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 size={13} />
                            <span>{successfulBatches} batch sukses</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Banner Peringatan jika sync portal terakhir gagal */}
            {lastPortalBatch && lastPortalBatch.status === 'failed' && (
                <div className="mb-6 p-4 bg-red-50/90 border border-red-200 rounded-2xl text-red-900 shadow-xs flex items-start gap-3.5">
                    <div className="p-2 rounded-xl bg-red-100 text-red-700 shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-sm">
                        <div className="font-bold text-red-950 flex flex-col sm:flex-row sm:items-center justify-between">
                            <span>Sinkronisasi Portal Terakhir Mengalami Kendala</span>
                            <span className="text-xs font-normal text-red-700 mt-1 sm:mt-0 bg-red-100/70 px-2 py-0.5 rounded-lg">
                                {formatDateTime(lastPortalBatch.started_at)}
                            </span>
                        </div>
                        <p className="mt-1 text-red-800 text-xs sm:text-sm font-medium">
                            Kendala: {getBatchErrorReason(lastPortalBatch) || 'Gagal terhubung ke Portal API atau timeout jaringan.'}
                        </p>
                        <p className="mt-1 text-xs text-red-700 leading-relaxed">
                            Data lokal tetap aman dan terlindungi menggunakan versi valid sebelumnya. Anda dapat menjalankan <strong>Simulasi (Dry Run)</strong> untuk memverifikasi koneksi atau melakukan <strong>Sync Sekarang</strong> secara manual.
                        </p>
                    </div>
                </div>
            )}

            {/* 2 Main Action Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Card 1: Sinkronisasi dari Portal API */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between relative hover:z-30 focus-within:z-30">
                    <div>
                        {/* Header Box */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-50 text-[#004D40] rounded-2xl border border-emerald-100/60">
                                    <RefreshCw className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <h2 className="text-lg font-bold text-gray-900">Sinkronisasi Portal API</h2>
                                        <InfoTooltip title="Sinkronisasi Portal" text="Tarik snapshot seluruh data pelatihan terdaftar langsung dari server API FR Academy." />
                                    </div>
                                    <p className="text-xs text-gray-500">Koneksi otomatis ke Portal FR Academy</p>
                                </div>
                            </div>

                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                                portalSyncConfig?.enabled
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${portalSyncConfig?.enabled ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                {portalSyncConfig?.enabled ? `Auto: ${portalSyncConfig?.time || '02:00'} WIB` : 'Manual'}
                            </span>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed mb-4">
                            Fitur ini mengambil snapshot data pelatihan terbaru secara terpusat langsung dari portal resmi FR Academy, lalu membersihkan dan menstandarisasi format NIK secara otomatis.
                        </p>

                        {syncErrors.portal && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                                <div>
                                    <strong>Gagal Sinkronisasi:</strong> {syncErrors.portal}
                                </div>
                            </div>
                        )}

                        {/* Status / Hasil Terakhir Box */}
                        <div className="mb-5 p-4 bg-gray-50/70 border border-gray-200/60 rounded-xl space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-200/50">
                                <span className="text-xs font-semibold text-gray-700">Snapshot Terakhir:</span>
                                {lastPortalBatch ? (
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                        lastPortalBatch.status === 'completed' 
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                            : 'bg-red-100 text-red-800 border border-red-200'
                                    }`}>
                                        {lastPortalBatch.status === 'completed' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                        {lastPortalBatch.status === 'completed' ? 'Selesai' : 'Gagal'}
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-400">Belum ada</span>
                                )}
                            </div>

                            {lastPortalBatch ? (
                                <>
                                    {/* 3 Metrics Mini Grid */}
                                    <div className="grid grid-cols-3 gap-2 py-1 text-center">
                                        <div className="bg-white p-2 rounded-lg border border-gray-100">
                                            <p className="text-[10px] text-gray-400 font-medium uppercase">Total Baris</p>
                                            <p className="text-sm font-extrabold text-gray-900">{lastPortalBatch.rows_total?.toLocaleString('id-ID') || 0}</p>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg border border-gray-100">
                                            <p className="text-[10px] text-emerald-600 font-medium uppercase">Diimpor</p>
                                            <p className="text-sm font-extrabold text-emerald-700">{lastPortalBatch.rows_imported?.toLocaleString('id-ID') || 0}</p>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg border border-gray-100">
                                            <p className="text-[10px] text-amber-600 font-medium uppercase">Dilewati</p>
                                            <p className="text-sm font-extrabold text-amber-700">{lastPortalBatch.rows_skipped?.toLocaleString('id-ID') || 0}</p>
                                        </div>
                                    </div>

                                    <div className="text-[11.5px] text-gray-500 flex flex-col gap-1 pt-1">
                                        <div className="flex justify-between">
                                            <span>Waktu Eksekusi:</span>
                                            <span className="font-semibold text-gray-700">{formatDateTime(lastPortalBatch.started_at)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Tipe Pemicu:</span>
                                            <span className="font-medium text-gray-700">
                                                {isScheduledBatch(lastPortalBatch) ? 'Cron Otomatis (Malam)' : (isDryRunBatch(lastPortalBatch) ? 'Simulasi (Dry Run)' : 'Manual Admin')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Catatan Kualitas:</span>
                                            <span className="font-medium text-amber-700">{getWarningCount(lastPortalBatch)} isu format</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs text-gray-500 py-1 text-center">
                                    Belum pernah dilakukan sinkronisasi portal pada sistem ini.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => handlePortalSync(false)}
                            disabled={syncProcessing}
                            className="flex-1 bg-[#004D40] hover:bg-[#00382e] text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {syncProcessing ? (
                                <>
                                    <RefreshCw className="animate-spin w-4 h-4 text-emerald-200" />
                                    <span>Menyinkronkan...</span>
                                </>
                            ) : (
                                <>
                                    <Play size={15} className="text-emerald-200" />
                                    <span>Sinkronkan Sekarang</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => handlePortalSync(true)}
                            disabled={syncProcessing}
                            className="bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 text-sm font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                            title="Uji penarikan data tanpa mengubah database"
                        >
                            <span>Simulasi (Dry Run)</span>
                        </button>
                    </div>
                </div>

                {/* Card 2: Manual Upload File */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between relative hover:z-30 focus-within:z-30">
                    <div>
                        {/* Header Box */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-teal-50 text-teal-800 rounded-2xl border border-teal-100/60">
                                    <UploadCloud className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <h2 className="text-lg font-bold text-gray-900">Upload Berkas Manual</h2>
                                        <InfoTooltip title="Upload Berkas Manual" text="Cadangan impor data melalui berkas spreadsheet Excel (.xlsx, .xls) atau teks (.csv)." />
                                    </div>
                                    <p className="text-xs text-gray-500">Pembaruan berkas data lokal master</p>
                                </div>
                            </div>
                        </div>

                        <form id="manual-upload-form" onSubmit={submit} className="space-y-4">
                            {/* Segmented Radio Options for Data Type */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pilih Kategori Data:</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setData('type', 'employee')}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                            data.type === 'employee'
                                                ? 'bg-emerald-50/70 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                        }`}
                                    >
                                        <Users size={16} className={data.type === 'employee' ? 'text-emerald-700' : 'text-gray-400'} />
                                        <span>Data Karyawan</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setData('type', 'training')}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                            data.type === 'training'
                                                ? 'bg-emerald-50/70 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                        }`}
                                    >
                                        <GraduationCap size={16} className={data.type === 'training' ? 'text-emerald-700' : 'text-gray-400'} />
                                        <span>Training Record</span>
                                    </button>
                                </div>
                            </div>

                            {/* Informational Callout regarding Upsert / Replace */}
                            <div className="p-3 bg-slate-50 border border-slate-200/70 text-xs text-slate-700 rounded-xl">
                                <div className="flex items-start gap-2">
                                    <Info size={14} className="text-slate-500 shrink-0 mt-0.5" />
                                    <div>
                                        {data.type === 'employee' ? (
                                            <p className="leading-relaxed">
                                                <strong>Metode Upsert:</strong> File karyawan yang diunggah akan memperbarui atau menambah data per <strong>Employee ID</strong>. Karyawan yang tidak ada dalam file baru <strong>tidak dihapus</strong> secara otomatis.
                                            </p>
                                        ) : (
                                            <p className="leading-relaxed">
                                                <strong>Full Replace:</strong> File training harus berupa <strong>rekap lengkap</strong>. Setiap kali impor training dilakukan, sistem akan <strong>mengganti seluruh</strong> rekaman data pelatihan lama.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Drag and Drop Upload Zone */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Berkas Spreadsheet (.xlsx, .xls, .csv):</label>
                                
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.txt,.xlsx,.xls"
                                    onChange={(e) => setData('file', e.target.files[0] || null)}
                                    className="hidden"
                                />

                                {data.file ? (
                                    /* Selected File Preview Box */
                                    <div className="p-4 bg-emerald-50/50 border-2 border-emerald-500/50 rounded-2xl flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
                                                <FileSpreadsheet className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-900 truncate">{data.file.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                                                    <span>{formatFileSize(data.file.size)}</span>
                                                    <span>•</span>
                                                    <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                                                        <Check size={12} /> Siap diimpor
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setData('file', null);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                            title="Batalkan pilihan berkas"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    /* Dropzone Empty State */
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                                        onDrop={handleFileDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`p-6 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer ${
                                            isDragging 
                                                ? 'border-emerald-500 bg-emerald-50/60' 
                                                : 'border-gray-200 hover:border-emerald-400 bg-gray-50/40 hover:bg-emerald-50/20'
                                        }`}
                                    >
                                        <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                                            <FileUp className="w-5 h-5" />
                                        </div>
                                        <p className="text-xs font-semibold text-gray-800">
                                            Klik untuk memilih berkas <span className="font-normal text-gray-500">atau seret ke area ini</span>
                                        </p>
                                        <div className="flex items-center justify-center gap-1.5 mt-2">
                                            <span className="text-[10px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">.XLSX</span>
                                            <span className="text-[10px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">.XLS</span>
                                            <span className="text-[10px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">.CSV</span>
                                        </div>
                                    </div>
                                )}

                                {errors.file && <p className="text-red-600 text-xs font-medium mt-1.5">{errors.file}</p>}
                            </div>
                        </form>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            form="manual-upload-form"
                            disabled={processing || !data.file}
                            className="w-full bg-[#004D40] hover:bg-[#00382e] text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {processing ? (
                                <>
                                    <RefreshCw className="animate-spin w-4 h-4 text-emerald-200" />
                                    <span>Memproses Impor File...</span>
                                </>
                            ) : (
                                <>
                                    <UploadCloud size={16} className="text-emerald-200" />
                                    <span>
                                        {data.type === 'employee' ? 'Jalankan Impor Data Karyawan' : 'Jalankan Impor Data Pelatihan'}
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Riwayat Import & Sinkronisasi Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
                {/* Header Table Container */}
                <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-gray-900">Riwayat Import &amp; Sinkronisasi</h2>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                {batches.length} Catatan
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Daftar 20 aktivitas pembaruan data terakhir beserta status dan detail baris yang diproses.
                        </p>
                    </div>

                    {/* Filter, Search, and Per-Page Toolbar */}
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
                        {/* Segmented Filter */}
                        <div className="flex items-center p-1 bg-gray-100 rounded-xl text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setTableFilter('all')}
                                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    tableFilter === 'all' 
                                        ? 'bg-white text-gray-900 shadow-2xs font-bold' 
                                        : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                Semua
                            </button>
                            <button
                                type="button"
                                onClick={() => setTableFilter('portal')}
                                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    tableFilter === 'portal' 
                                        ? 'bg-white text-emerald-800 shadow-2xs font-bold' 
                                        : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                Portal API ({portalBatchCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setTableFilter('manual')}
                                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    tableFilter === 'manual' 
                                        ? 'bg-white text-teal-800 shadow-2xs font-bold' 
                                        : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                Berkas Manual ({manualBatchCount})
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama berkas..."
                                className="pl-8.5 pr-8 py-1.5 text-xs bg-gray-50 hover:bg-white focus:bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all w-full sm:w-44"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        {/* Tampilkan Berapa Baris (Per Page Selector) */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 shrink-0 self-end lg:self-center">
                            <span className="text-[11px] font-medium text-gray-500">Tampilkan:</span>
                            <select
                                value={perPage}
                                onChange={(e) => setPerPage(Number(e.target.value))}
                                className="border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs bg-white shadow-2xs cursor-pointer font-bold text-gray-700"
                            >
                                <option value={5}>5 baris</option>
                                <option value={10}>10 baris</option>
                                <option value={20}>20 baris</option>
                                <option value={50}>50 baris</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Component */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-5 py-3.5">ID</th>
                                <th className="px-5 py-3.5">Kategori</th>
                                <th className="px-5 py-3.5">Sumber / Nama Berkas</th>
                                <th className="px-5 py-3.5 text-center">Rincian Baris Data</th>
                                <th className="px-5 py-3.5">Waktu Mulai</th>
                                <th className="px-5 py-3.5 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                            {paginatedBatches.length > 0 ? (
                                paginatedBatches.map((b) => {
                                    const isPortal = b.filename && b.filename.includes('Portal API');
                                    const isScheduled = isScheduledBatch(b);
                                    const isDryRun = isDryRunBatch(b);
                                    const warningCount = getWarningCount(b);
                                    const errorReason = getBatchErrorReason(b);

                                    return (
                                        <tr key={b.id} className="hover:bg-emerald-50/30 transition-colors">
                                            {/* ID */}
                                            <td className="px-5 py-4 text-gray-500 font-mono text-xs">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-semibold text-gray-700">
                                                    #{b.id}
                                                </span>
                                            </td>

                                            {/* Category Type */}
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${
                                                    b.type === 'employee' 
                                                        ? 'bg-blue-50 text-blue-800 border border-blue-200/60' 
                                                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                                }`}>
                                                    {b.type === 'employee' ? <Users size={12} /> : <GraduationCap size={12} />}
                                                    <span>{b.type === 'employee' ? 'Karyawan' : 'Pelatihan'}</span>
                                                </span>
                                            </td>

                                            {/* Source / Filename */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 rounded-lg shrink-0 ${isPortal ? 'bg-emerald-50 text-emerald-700' : 'bg-teal-50 text-teal-700'}`}>
                                                        {isPortal ? <RefreshCw size={14} /> : <FileSpreadsheet size={14} />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-gray-900 truncate max-w-xs sm:max-w-md">
                                                            {b.filename}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                                                            {isScheduled && (
                                                                <span className="text-emerald-700 font-medium">Cron Terjadwal Malam</span>
                                                            )}
                                                            {isDryRun && (
                                                                <span className="text-amber-700 font-medium">Uji Simulasi (Dry-Run)</span>
                                                            )}
                                                            {!isScheduled && !isDryRun && (
                                                                <span>{isPortal ? 'Sinkronisasi Manual' : 'Upload Spreadsheet'}</span>
                                                            )}
                                                            {warningCount > 0 && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="text-amber-600 font-medium">{warningCount} issue format</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {errorReason && (
                                                            <p className="text-[11px] text-red-600 font-medium mt-0.5">
                                                                Error: {errorReason}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Rows Counts */}
                                            <td className="px-5 py-4 text-center">
                                                <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 font-mono text-[11px]">
                                                    <span className="text-gray-500" title="Total Baris">
                                                        Total: <strong className="text-gray-800">{b.rows_total?.toLocaleString('id-ID') || 0}</strong>
                                                    </span>
                                                    <span className="text-gray-300">|</span>
                                                    <span className="text-emerald-700" title="Berhasil Diimpor">
                                                        Diimpor: <strong>{b.rows_imported?.toLocaleString('id-ID') || 0}</strong>
                                                    </span>
                                                    {b.rows_skipped > 0 && (
                                                        <>
                                                            <span className="text-gray-300">|</span>
                                                            <span className="text-amber-700" title="Dilewati">
                                                                Lewat: <strong>{b.rows_skipped?.toLocaleString('id-ID') || 0}</strong>
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Timestamp */}
                                            <td className="px-5 py-4 text-gray-600 text-xs whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={13} className="text-gray-400" />
                                                    <span>{formatDateTime(b.started_at)}</span>
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-5 py-4 text-right">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    b.status === 'completed'
                                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                        : b.status === 'failed'
                                                        ? 'bg-red-50 text-red-800 border border-red-200'
                                                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                                                }`}>
                                                    {b.status === 'completed' && <CheckCircle2 size={12} />}
                                                    {b.status === 'failed' && <XCircle size={12} />}
                                                    {b.status !== 'completed' && b.status !== 'failed' && <Clock size={12} />}
                                                    <span className="capitalize">{b.status}</span>
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="p-3 rounded-full bg-gray-50 text-gray-400">
                                                <Search size={20} />
                                            </div>
                                            <p className="text-sm font-semibold text-gray-600">Tidak ada riwayat import yang cocok</p>
                                            <p className="text-xs text-gray-400">Silakan ubah filter kategori atau kata kunci pencarian Anda.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {totalFiltered > 0 && (
                    <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
                        <div className="text-xs text-gray-500">
                            Menampilkan <span className="font-semibold text-gray-900">{totalFiltered === 0 ? 0 : startIndex + 1}</span> - <span className="font-semibold text-gray-900">{endIndex}</span> dari <span className="font-semibold text-gray-900">{totalFiltered.toLocaleString('id-ID')}</span> riwayat
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    className="min-w-[2rem] h-8 px-2 flex items-center justify-center rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-900 cursor-pointer"
                                    aria-label="Halaman sebelumnya"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    if (
                                        pageNum === 1 || 
                                        pageNum === totalPages || 
                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={pageNum}
                                                type="button"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`min-w-[2rem] h-8 px-2.5 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                                    currentPage === pageNum
                                                        ? 'bg-[#004D40] text-white shadow-2xs'
                                                        : 'text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-900'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    } else if (
                                        pageNum === currentPage - 2 || 
                                        pageNum === currentPage + 2
                                    ) {
                                        return (
                                            <span key={pageNum} className="min-w-[1.5rem] text-center text-xs text-gray-400">
                                                ...
                                            </span>
                                        );
                                    }
                                    return null;
                                })}

                                <button
                                    type="button"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    className="min-w-[2rem] h-8 px-2 flex items-center justify-center rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-900 cursor-pointer"
                                    aria-label="Halaman berikutnya"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
