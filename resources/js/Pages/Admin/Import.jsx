import { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

export default function Import() {
    const { batches } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'employee',
        file: null,
    });

    const { post: postSync, processing: syncProcessing, errors: syncErrors } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post('/admin/import', {
            onSuccess: () => reset('file'),
        });
    };

    const handlePortalSync = (dryRun = false) => {
        const message = dryRun
            ? 'Jalankan simulasi (dry-run) penarikan data dari portal?'
            : 'Data training saat ini akan diganti dengan data terbaru dari portal.';

        if (window.confirm(message)) {
            postSync('/admin/import/portal-sync', {
                data: { dry_run: dryRun },
                preserveScroll: true,
            });
        }
    };

    // Cari batch sync portal terakhir
    const lastPortalBatch = batches?.find((b) => b.filename && b.filename.includes('Portal API'));
    
    // Hitung total peringatan
    const getWarningCount = (batch) => {
        if (!batch || !batch.warnings) return 0;
        const w = typeof batch.warnings === 'string' ? JSON.parse(batch.warnings) : batch.warnings;
        if (typeof w !== 'object' || w === null) return 0;
        return Object.values(w).reduce((acc, curr) => acc + (curr?.count || 0), 0);
    };

    return (
        <AppLayout title="Import Data">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Import &amp; Sinkronisasi Data</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Card 1: Sinkronisasi dari Portal API */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-lg">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Sinkronisasi dari Portal</h2>
                                <p className="text-xs text-gray-500">Tarik data training otomatis dari Portal FR Academy</p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Fitur ini akan mengambil snapshot data pelatihan terbaru langsung dari portal resmi FR Academy dan memprosesnya melalui aturan pembersihan standar.
                        </p>

                        {syncErrors.portal && (
                            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-sm text-red-700 rounded-r">
                                <strong>Error:</strong> {syncErrors.portal}
                            </div>
                        )}

                        {/* Status / Hasil Terakhir */}
                        {lastPortalBatch ? (
                            <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                                <div className="font-semibold text-slate-700 flex justify-between items-center">
                                    <span>Hasil Sync Terakhir:</span>
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                        lastPortalBatch.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {lastPortalBatch.status}
                                    </span>
                                </div>
                                <div className="text-slate-600">
                                    Waktu: <span className="font-medium text-slate-800">{new Date(lastPortalBatch.started_at).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="text-slate-600">
                                    Baris: <span className="font-medium text-slate-800">{lastPortalBatch.rows_total} Total</span> | <span className="text-emerald-700 font-medium">{lastPortalBatch.rows_imported} Diimpor</span> | <span className="text-amber-700 font-medium">{lastPortalBatch.rows_skipped} Dilewati</span>
                                </div>
                                <div className="text-slate-600">
                                    Peringatan: <span className="font-medium text-slate-800">{getWarningCount(lastPortalBatch)} isu kualitas</span>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                                Belum pernah dilakukan sinkronisasi portal.
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={() => handlePortalSync(false)}
                            disabled={syncProcessing}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                            {syncProcessing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Menyinkronkan...</span>
                                </>
                            ) : (
                                <span>Sync Sekarang</span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => handlePortalSync(true)}
                            disabled={syncProcessing}
                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 px-3 rounded-lg transition-colors disabled:opacity-50"
                            title="Uji penarikan data tanpa mengubah database"
                        >
                            Simulasi (Dry Run)
                        </button>
                    </div>
                </div>

                {/* Card 2: Manual Upload File */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Upload File Manual</h2>
                            <p className="text-xs text-gray-500">Cadangan upload manual (.xlsx, .csv)</p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Data</label>
                            <select
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm"
                            >
                                <option value="employee">Data Karyawan</option>
                                <option value="training">Training Record</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">File Upload (.csv, .xlsx)</label>

                            <div className="mb-3 p-3 bg-amber-50 border-l-4 border-amber-400 text-xs text-amber-800 rounded-r">
                                <strong>CATATAN:</strong>
                                {data.type === 'employee' ? (
                                    <p className="mt-0.5">
                                        File Karyawan yang diupload <strong>MENGGANTIKAN</strong> data lama per Employee ID (upsert). Karyawan yang hilang dari file baru <strong>TIDAK otomatis dihapus</strong>.
                                    </p>
                                ) : (
                                    <p className="mt-0.5">
                                        File Training yang diupload harus berupa <strong>REKAP LENGKAP</strong>. Setiap import training akan <strong>MENGGANTI SELURUH data lama</strong>.
                                    </p>
                                )}
                            </div>

                            <input
                                type="file"
                                accept=".csv,.txt,.xlsx,.xls"
                                onChange={(e) => setData('file', e.target.files[0])}
                                className="w-full border border-gray-300 p-2 rounded-lg text-sm"
                            />
                            {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={processing || !data.file}
                            className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm shadow-sm transition-colors"
                        >
                            {processing ? 'Mengimpor File...' : 'Jalankan Import File'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Tabel Riwayat Import */}
            <h2 className="text-xl font-bold mb-4 text-gray-800">Riwayat Import &amp; Sinkronisasi</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-3.5 text-xs font-semibold text-gray-600">ID</th>
                            <th className="p-3.5 text-xs font-semibold text-gray-600">Tipe</th>
                            <th className="p-3.5 text-xs font-semibold text-gray-600">Sumber / File</th>
                            <th className="p-3.5 text-xs font-semibold text-gray-600">Total / Diimpor / Dilewati</th>
                            <th className="p-3.5 text-xs font-semibold text-gray-600">Waktu Mulai</th>
                            <th className="p-3.5 text-xs font-semibold text-gray-600">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                        {batches?.map((b) => (
                            <tr key={b.id} className="hover:bg-gray-50/60">
                                <td className="p-3.5 text-gray-500 font-mono text-xs">{b.id}</td>
                                <td className="p-3.5 font-medium capitalize">{b.type}</td>
                                <td className="p-3.5 text-gray-800">{b.filename}</td>
                                <td className="p-3.5 text-gray-600 font-mono text-xs">
                                    {b.rows_total} / <span className="text-emerald-700 font-semibold">{b.rows_imported}</span> / <span className="text-amber-700">{b.rows_skipped}</span>
                                </td>
                                <td className="p-3.5 text-gray-500 text-xs">
                                    {new Date(b.started_at).toLocaleString('id-ID')}
                                </td>
                                <td className="p-3.5">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        b.status === 'completed'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : b.status === 'failed'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {b.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
