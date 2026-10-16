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
    ChevronRight,
    Trash2,
    Download,
    FileText
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
    const { batches = [], portalSyncConfig, counts = { employee: 0, training: 0 }, flash } = usePage().props;
    const [isDragging, setIsDragging] = useState(false);
    const [tableFilter, setTableFilter] = useState('all'); // all | portal | manual
    const [searchQuery, setSearchQuery] = useState('');
    const [perPage, setPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    const fileInputRef = useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'employee',
        file: null,
        replace_all: false,
    });

    const { post: postSync, processing: syncProcessing, errors: syncErrors } = useForm({});

    const [resetModal, setResetModal] = useState({
        isOpen: false,
        target: 'employee',
    });
    const { 
        data: resetForm, 
        setData: setResetForm, 
        post: postReset, 
        processing: resetProcessing, 
        errors: resetErrors, 
        reset: clearResetForm,
        clearErrors: clearResetErrors,
    } = useForm({
        target: 'employee',
        confirmation: '',
    });

    const openResetModal = (target) => {
        clearResetErrors();
        setResetForm({
            target,
            confirmation: '',
        });
        setResetModal({ isOpen: true, target });
    };

    const closeResetModal = () => {
        if (resetProcessing) return;
        setResetModal({ isOpen: false, target: 'employee' });
        clearResetForm();
        clearResetErrors();
    };

    const handleConfirmReset = (e) => {
        e.preventDefault();
        postReset('/admin/import/reset', {
            preserveScroll: true,
            onSuccess: () => {
                closeResetModal();
            },
        });
    };

    const submit = (e) => {
        e.preventDefault();
        post('/admin/import', {
            onSuccess: () => {
                reset('file', 'replace_all');
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

            {/* Flash Messages */}
            {flash?.success && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 shadow-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-sm font-medium">{flash.success}</span>
                    </div>
                </div>
            )}
            {flash?.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-900 shadow-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                        <span className="text-sm font-medium">{flash.error}</span>
                    </div>
                </div>
            )}

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
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold text-gray-700">Pilih Kategori Data:</label>
                                    <a
                                        href={`/admin/import/template/${data.type}`}
                                        download
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-0.5 rounded-lg border border-emerald-200/80 transition-colors"
                                        title={`Unduh format Excel standar untuk ${data.type === 'employee' ? 'Data Karyawan' : 'Data Pelatihan'}`}
                                    >
                                        <Download size={12} />
                                        <span>Unduh Template {data.type === 'employee' ? 'Karyawan' : 'Pelatihan'} (.xlsx)</span>
                                    </a>
                                </div>
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
                                                <strong>Mode Normal (Upsert):</strong> File karyawan akan memperbarui atau menambah data per <strong>Employee ID</strong>. Data lama di luar file tidak dihapus secara otomatis kecuali opsi ganti total di bawah dicentang.
                                            </p>
                                        ) : (
                                            <p className="leading-relaxed">
                                                <strong>Full Replace:</strong> File training harus berupa <strong>rekap lengkap</strong>. Setiap kali impor training dilakukan, sistem akan <strong>mengganti seluruh</strong> rekaman data pelatihan lama.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Checkbox Ganti Total (Replace All) Khusus Karyawan */}
                            {data.type === 'employee' && (
                                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                                    <label className="flex items-start gap-2.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.replace_all}
                                            onChange={(e) => setData('replace_all', e.target.checked)}
                                            className="mt-0.5 w-4 h-4 rounded text-[#004D40] focus:ring-emerald-500 border-gray-300 cursor-pointer"
                                        />
                                        <div className="text-xs">
                                            <span className="font-bold text-amber-950">
                                                Ganti total data karyawan (Kosongkan data lama)
                                            </span>
                                            <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                                                Centang opsi ini jika file baru Anda hanya berisi level tertentu (misal: <strong>Level C–F saja</strong>). Sistem akan menghapus seluruh data karyawan lama terlebih dahulu sebelum mengisi data baru, sehingga data lama di luar level tersebut tidak nyangkut.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            )}

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

                                {/* Tips Format & Rumus Excel */}
                                <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-[11.5px] text-amber-900 flex items-start gap-2">
                                    <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                                    <div className="leading-relaxed">
                                        <strong>Penting (Paste as Values):</strong> Jika Anda mengolah data menggunakan rumus Excel (seperti <code>VLOOKUP</code> / <code>IFERROR</code>), pastikan melakukan <strong>Copy &gt; Paste as Values (Tempel Nilai)</strong> sebelum menyimpan agar rumus tidak terbaca sebagai teks mentah.
                                    </div>
                                </div>
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
                                        {data.type === 'employee' 
                                            ? (data.replace_all ? 'Ganti Total & Impor Karyawan' : 'Jalankan Impor Data Karyawan')
                                            : 'Jalankan Impor Data Pelatihan'}
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Template Berkas & Panduan Format Standar */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                            <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Template Berkas &amp; Format Standar Excel</h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Unduh template resmi sistem untuk memastikan susunan kolom, nama header, dan format data sesuai standar import.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Card Template Karyawan */}
                    <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                    <Users size={14} className="text-emerald-700" />
                                    Template Data Karyawan (.xlsx)
                                </span>
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200">
                                    22 Kolom Standar
                                </span>
                            </div>
                            <p className="text-xs text-emerald-900/80 leading-relaxed mb-3">
                                Format baku data karyawan (Employee ID, Join Date, Level C–F, Company Code, Group, Region, dll.) lengkap dengan contoh baris yang valid.
                            </p>
                        </div>
                        <a
                            href="/admin/import/template/employee"
                            download
                            className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-white bg-[#004D40] hover:bg-[#00382e] rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                            <Download size={14} />
                            <span>Unduh Template Karyawan (.xlsx)</span>
                        </a>
                    </div>

                    {/* Card Template Pelatihan */}
                    <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/30 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                                    <GraduationCap size={14} className="text-teal-700" />
                                    Template Data Pelatihan (.xlsx)
                                </span>
                                <span className="text-[10px] font-semibold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-full border border-teal-200">
                                    23 Kolom Standar
                                </span>
                            </div>
                            <p className="text-xs text-teal-900/80 leading-relaxed mb-3">
                                Format rekaman pelatihan operasional (Event ID, Batch ID, NIK, Judul Pelatihan, Tanggal, Jam Efektif, dll.) dengan relasi NIK ke karyawan.
                            </p>
                        </div>
                        <a
                            href="/admin/import/template/training"
                            download
                            className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-teal-900 bg-teal-100 hover:bg-teal-200 border border-teal-200 rounded-xl transition-all cursor-pointer"
                        >
                            <Download size={14} />
                            <span>Unduh Template Pelatihan (.xlsx)</span>
                        </a>
                    </div>
                </div>

                {/* Ketentuan Format */}
                <div className="p-3.5 bg-gray-50 border border-gray-200/70 rounded-xl">
                    <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                        <Info size={13} className="text-gray-500" />
                        Ketentuan Penting Pengisian Berkas:
                    </h4>
                    <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
                        <li><strong>Susunan &amp; Nama Kolom:</strong> Jangan mengubah, menambah, atau menghapus urutan 22 kolom di baris 1 (Header).</li>
                        <li><strong>Tempel sebagai Nilai (Paste Values):</strong> Jika Anda mengisi kolom seperti Group &amp; Region menggunakan formula (misal <code>=VLOOKUP()</code> atau <code>=IFERROR()</code>), pastikan lakukan <em>Copy &gt; Paste Special &gt; Values</em> sebelum disimpan. Sistem kini juga otomatis memproteksi dan memetakan formula ke nilai standar bila terdeteksi.</li>
                        <li><strong>Format Tanggal:</strong> Gunakan format tanggal standar Excel atau teks <code>YYYY-MM-DD</code> (contoh: <code>2024-01-15</code>).</li>
                        <li><strong>Update Khusus Level C–F:</strong> Jika file baru Anda hanya berisi level C–F, aktifkan opsi <strong>"Ganti total data karyawan"</strong> saat impor agar data level lain yang lama bersih secara menyeluruh.</li>
                    </ul>
                </div>
            </div>

            {/* Zona Pembersihan Data Master */}
            <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-2xs mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Pembersihan Data Master (Reset)</h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Hapus atau kosongkan data lama di database jika ingin memulai ulang dengan data baru yang bersih.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card Hapus Data Karyawan */}
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                    <Users size={14} className="text-gray-500" />
                                    Master Data Karyawan
                                </span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200/80 text-gray-700">
                                    {(counts?.employee || 0).toLocaleString('id-ID')} baris
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed mb-4">
                                Menghapus seluruh data master karyawan yang ada saat ini. Cocok digunakan jika Anda ingin membersihkan data lama sebelum mengunggah file baru yang hanya berisi level tertentu (misal: <strong>Level C–F saja</strong>).
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => openResetModal('employee')}
                            disabled={(counts?.employee || 0) === 0}
                            className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100/80 border border-red-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 size={14} />
                            <span>Hapus Semua Data Karyawan</span>
                        </button>
                    </div>

                    {/* Card Hapus Data Pelatihan */}
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                    <GraduationCap size={14} className="text-gray-500" />
                                    Rekam Data Pelatihan
                                </span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200/80 text-gray-700">
                                    {(counts?.training || 0).toLocaleString('id-ID')} baris
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed mb-4">
                                Mengosongkan seluruh riwayat pelatihan dari database. Anda dapat mengimpor kembali melalui berkas spreadsheet atau menarik ulang snapshot terbaru dari Portal FR Academy.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => openResetModal('training')}
                            disabled={(counts?.training || 0) === 0}
                            className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100/80 border border-red-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 size={14} />
                            <span>Hapus Semua Data Pelatihan</span>
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

            {/* Modal Konfirmasi Hapus / Reset Data */}
            {resetModal.isOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-150"
                    onClick={closeResetModal}
                >
                    <div 
                        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-red-100 text-red-700 rounded-2xl shrink-0">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {resetModal.target === 'employee' && 'Konfirmasi Hapus Data Karyawan'}
                                    {resetModal.target === 'training' && 'Konfirmasi Hapus Data Pelatihan'}
                                    {resetModal.target === 'all' && 'Konfirmasi Hapus Seluruh Data'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-red-50/70 border border-red-200/80 rounded-xl text-xs text-red-900 space-y-2 mb-4">
                            {resetModal.target === 'employee' && (
                                <>
                                    <p className="font-semibold">
                                        Anda akan menghapus seluruh {(counts?.employee || 0).toLocaleString('id-ID')} data karyawan dari database.
                                    </p>
                                    <p className="text-red-700 leading-relaxed">
                                        Data riwayat pelatihan tidak akan dihapus, namun kaitan dengan data karyawan akan dilepas. Saat Anda mengimpor file karyawan baru nantinya, relasi NIK akan otomatis tersambung kembali.
                                    </p>
                                </>
                            )}
                            {resetModal.target === 'training' && (
                                <>
                                    <p className="font-semibold">
                                        Anda akan menghapus seluruh {(counts?.training || 0).toLocaleString('id-ID')} baris data pelatihan dari database.
                                    </p>
                                    <p className="text-red-700 leading-relaxed">
                                        Database pelatihan akan dikosongkan secara total. Anda dapat mengimpor kembali melalui berkas spreadsheet atau sinkronisasi Portal FR Academy.
                                    </p>
                                </>
                            )}
                            {resetModal.target === 'all' && (
                                <p className="font-semibold">
                                    Anda akan menghapus bersih seluruh data karyawan ({(counts?.employee || 0).toLocaleString('id-ID')} baris) dan data pelatihan ({(counts?.training || 0).toLocaleString('id-ID')} baris).
                                </p>
                            )}
                        </div>

                        <form onSubmit={handleConfirmReset} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Ketik kata <span className="font-bold text-red-700 underline tracking-wider">HAPUS</span> untuk konfirmasi:
                                </label>
                                <input
                                    type="text"
                                    value={resetForm.confirmation}
                                    onChange={(e) => setResetForm('confirmation', e.target.value)}
                                    placeholder="Ketik HAPUS di sini"
                                    disabled={resetProcessing}
                                    className="w-full text-sm font-semibold tracking-wider px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                                    autoFocus
                                />
                                {resetErrors?.confirmation && (
                                    <p className="text-red-600 text-xs mt-1 font-medium">{resetErrors.confirmation}</p>
                                )}
                                {resetErrors?.reset && (
                                    <p className="text-red-600 text-xs mt-1 font-medium">{resetErrors.reset}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={closeResetModal}
                                    disabled={resetProcessing}
                                    className="px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    Batal
                                </button>

                                <button
                                    type="submit"
                                    disabled={resetForm.confirmation.trim().toUpperCase() !== 'HAPUS' || resetProcessing}
                                    className="px-4 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center gap-1.5"
                                >
                                    {resetProcessing ? (
                                        <>
                                            <RefreshCw className="animate-spin w-3.5 h-3.5" />
                                            <span>Menghapus...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={13} />
                                            <span>Ya, Hapus Data Sekarang</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
