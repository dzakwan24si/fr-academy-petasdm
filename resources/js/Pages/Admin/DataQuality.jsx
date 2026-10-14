import { usePage, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { InfoTooltip } from '@/Components/ui/InfoTooltip';
import { 
    CheckCircle2, 
    AlertTriangle, 
    AlertCircle, 
    Database, 
    Building2, 
    ShieldCheck, 
    HelpCircle,
    FileSpreadsheet,
    Layers
} from 'lucide-react';

export default function DataQuality() {
    const { stats } = usePage().props;

    const totalRows = stats?.training_rows || 0;
    const nikOk = stats?.nik_ok || 0;
    const nikEmpty = stats?.nik_empty || 0;
    const nikCorrupt = stats?.nik_corrupt || 0;
    const nikInvalid = stats?.nik_invalid || 0;
    const unmatchedNik = stats?.unmatched_nik || 0;

    const aliasTotal = stats?.alias_total || 0;
    const aliasUnmatched = stats?.alias_unmatched || 0;
    const aliasMapped = Math.max(0, aliasTotal - aliasUnmatched);

    const nikProblemCount = nikEmpty + nikCorrupt + nikInvalid;

    const nikOkPct = totalRows > 0 ? ((nikOk / totalRows) * 100).toFixed(1) : '0';
    const nikEmptyPct = totalRows > 0 ? ((nikEmpty / totalRows) * 100).toFixed(1) : '0';
    const nikCorruptPct = totalRows > 0 ? ((nikCorrupt / totalRows) * 100).toFixed(1) : '0';
    const nikInvalidPct = totalRows > 0 ? ((nikInvalid / totalRows) * 100).toFixed(1) : '0';

    const aliasScorePct = aliasTotal > 0 ? ((aliasMapped / aliasTotal) * 100).toFixed(1) : '0';

    return (
        <AppLayout title="Kualitas & Integritas Data">
            <Head title="Kualitas & Integritas Data" />

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kualitas &amp; Integritas Data</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Pemantauan kesehatan NIK pelatihan, pemetaan alias PT, dan keabsahan relasi data karyawan.
                    </p>
                </div>
                
                <div className="flex items-center gap-2">
                    <Link
                        href="/pelatihan/data"
                        className="inline-flex items-center px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs"
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-1.5 text-gray-500" />
                        Data Mentah
                    </Link>
                    <Link
                        href="/admin/import"
                        className="inline-flex items-center px-3.5 py-2 text-sm font-medium text-white bg-[#004D40] rounded-xl hover:bg-[#00382e] transition-colors shadow-xs"
                    >
                        <Layers className="w-4 h-4 mr-1.5 text-emerald-200" />
                        Sinkronisasi Data
                    </Link>
                </div>
            </div>

            {/* 4 Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Score Validitas NIK */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between relative hover:z-40 focus-within:z-40">
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Kesehatan NIK</span>
                            <InfoTooltip title="Kesehatan NIK" text="Persentase baris data riwayat pelatihan yang memiliki NIK dengan format 8 digit numerik standar." />
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold text-gray-900">{nikOkPct}%</div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>{nikOk.toLocaleString('id-ID')} baris NIK valid</span>
                        </div>
                    </div>
                </div>

                {/* Total Baris Training */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between relative hover:z-40 focus-within:z-40">
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Baris Data</span>
                            <InfoTooltip title="Total Baris Data" text="Jumlah keseluruhan entri pelatihan yang terdaftar pada tabel riwayat pelatihan." />
                        </div>
                        <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                            <Database className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold text-gray-900">{totalRows.toLocaleString('id-ID')}</div>
                        <div className="mt-1 text-xs text-gray-500">
                            Total rekam pelatihan tercatat
                        </div>
                    </div>
                </div>

                {/* NIK Perlu Tindakan */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between relative hover:z-40 focus-within:z-40">
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">NIK Bermasalah</span>
                            <InfoTooltip title="NIK Bermasalah" text="Akumulasi baris data pelatihan dengan NIK kosong, berformat teks rusak (corrupt), atau tidak berupa 8 digit numerik." />
                        </div>
                        <div className={`p-2 rounded-xl ${nikProblemCount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold text-gray-900">{nikProblemCount.toLocaleString('id-ID')}</div>
                        <div className="mt-1 text-xs text-gray-500">
                            Kosong, rusak, atau format huruf
                        </div>
                    </div>
                </div>

                {/* Pemetaan Alias PT */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between relative hover:z-40 focus-within:z-40">
                    <div className="flex items-center justify-between text-gray-500 mb-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pemetaan Alias PT</span>
                            <InfoTooltip title="Pemetaan Alias PT" text="Persentase nama variasi penulisan PT / entitas yang sudah berhasil dipetakan ke perusahaan resmi master." />
                        </div>
                        <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                            <Building2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold text-gray-900">{aliasScorePct}%</div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                            <span>{aliasMapped} dari {aliasTotal} alias terpetakan</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visual Health Breakdown Stacked Bar */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Distribusi Kualitas Format NIK</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Proporsi format NIK peserta pada database pelatihan</p>
                    </div>
                    <span className="text-xs font-medium text-gray-500 self-start sm:self-auto bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200/60">
                        {totalRows.toLocaleString('id-ID')} Total Rekam
                    </span>
                </div>

                {/* Stacked Bar */}
                <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                    {totalRows > 0 ? (
                        <>
                            <div 
                                style={{ width: `${nikOkPct}%` }} 
                                className="bg-emerald-600 h-full transition-all duration-500 hover:opacity-90"
                                title={`NIK Valid: ${nikOk.toLocaleString('id-ID')} (${nikOkPct}%)`}
                            />
                            <div 
                                style={{ width: `${nikEmptyPct}%` }} 
                                className="bg-slate-400 h-full transition-all duration-500 hover:opacity-90"
                                title={`NIK Kosong: ${nikEmpty.toLocaleString('id-ID')} (${nikEmptyPct}%)`}
                            />
                            <div 
                                style={{ width: `${nikCorruptPct}%` }} 
                                className="bg-rose-500 h-full transition-all duration-500 hover:opacity-90"
                                title={`NIK Rusak / Ilmiah: ${nikCorrupt.toLocaleString('id-ID')} (${nikCorruptPct}%)`}
                            />
                            <div 
                                style={{ width: `${nikInvalidPct}%` }} 
                                className="bg-amber-500 h-full transition-all duration-500 hover:opacity-90"
                                title={`NIK Huruf / Tidak Valid: ${nikInvalid.toLocaleString('id-ID')} (${nikInvalidPct}%)`}
                            />
                        </>
                    ) : (
                        <div className="w-full bg-gray-200 h-full"></div>
                    )}
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-4 border-t border-gray-100 text-xs">
                    <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0"></span>
                        <div>
                            <span className="text-gray-500">Valid (Angka):</span>
                            <span className="font-bold text-gray-800 ml-1.5">{nikOk.toLocaleString('id-ID')} ({nikOkPct}%)</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full bg-slate-400 shrink-0"></span>
                        <div>
                            <span className="text-gray-500">Kosong / Strip:</span>
                            <span className="font-bold text-gray-800 ml-1.5">{nikEmpty.toLocaleString('id-ID')} ({nikEmptyPct}%)</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0"></span>
                        <div>
                            <span className="text-gray-500">Format Ilmiah:</span>
                            <span className="font-bold text-gray-800 ml-1.5">{nikCorrupt.toLocaleString('id-ID')} ({nikCorruptPct}%)</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
                        <div>
                            <span className="text-gray-500">Format Huruf:</span>
                            <span className="font-bold text-gray-800 ml-1.5">{nikInvalid.toLocaleString('id-ID')} ({nikInvalidPct}%)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2 Detailed Breakdown Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Detail NIK */}
                <div className="bg-white p-6 rounded-2xl shadow-2xs border border-gray-100 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Klasifikasi Format NIK (Training)</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Rincian status sanitasi data NIK yang diimpor</p>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                                4 Kategori
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">NIK Valid (Angka Murni)</div>
                                        <div className="text-xs text-gray-500">Format digit angka standar &amp; siap dihubungkan</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-emerald-700">{nikOk.toLocaleString('id-ID')}</div>
                                    <div className="text-xs text-gray-400">{nikOkPct}%</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">NIK Kosong / '-'</div>
                                        <div className="text-xs text-gray-500">Data peserta tanpa identitas NIK</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-slate-700">{nikEmpty.toLocaleString('id-ID')}</div>
                                    <div className="text-xs text-gray-400">{nikEmptyPct}%</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">Format Ilmiah (Corrupt)</div>
                                        <div className="text-xs text-gray-500">Notasi eksponensial akibat konversi Excel (misal 1.23E+12)</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-rose-700">{nikCorrupt.toLocaleString('id-ID')}</div>
                                    <div className="text-xs text-gray-400">{nikCorruptPct}%</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">NIK Format Huruf / Tidak Valid</div>
                                        <div className="text-xs text-gray-500">Berisi teks non-numerik acak</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-amber-700">{nikInvalid.toLocaleString('id-ID')}</div>
                                    <div className="text-xs text-gray-400">{nikInvalidPct}%</div>
                                </div>
                            </div>
                        </div>

                        {/* Unmatched NIK Alert */}
                        <div className="mt-4 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/60 flex items-start gap-3 text-xs text-amber-900">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold text-amber-950">
                                    {unmatchedNik.toLocaleString('id-ID')} NIK Berformat Valid Belum Terhubung:
                                </span>
                                <span className="text-amber-800 ml-1">
                                    Format NIK sudah angka murni, namun nomor NIK tidak ditemukan pada Master Karyawan (dapat berupa mantan staf, trainee eksternal, atau perbedaan kode NIK).
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pemetaan Perusahaan */}
                <div className="bg-white p-6 rounded-2xl shadow-2xs border border-gray-100 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Pemetaan Perusahaan (Alias PT)</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Penghubungan variasi penulisan PT di raw training ke master company</p>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60">
                                {aliasScorePct}% Mapped
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">Total Alias PT (Unik)</div>
                                    <div className="text-xs text-gray-500">Jumlah ragam nama PT yang tercatat di data training</div>
                                </div>
                                <div className="text-base font-bold text-gray-900">{aliasTotal}</div>
                            </div>

                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                                <div>
                                    <div className="text-sm font-semibold text-emerald-950">Alias Sudah Terpetakan</div>
                                    <div className="text-xs text-emerald-700">Terkoneksi ke entitas Company yang sah</div>
                                </div>
                                <div className="text-base font-bold text-emerald-700">{aliasMapped}</div>
                            </div>

                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50/50 border border-rose-100">
                                <div>
                                    <div className="text-sm font-semibold text-rose-950">Alias Belum Terpetakan</div>
                                    <div className="text-xs text-rose-700">Nama PT belum terhubung ke entitas Master Company</div>
                                </div>
                                <div className="text-base font-bold text-rose-700">{aliasUnmatched}</div>
                            </div>
                        </div>

                        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600">
                            <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                                Panduan Pemetaan Alias
                            </div>
                            <p className="leading-relaxed">
                                Untuk memetakan alias nama PT baru, lakukan pembaruan kolom <code className="px-1.5 py-0.5 rounded bg-slate-200/70 font-mono text-slate-800">company_id</code> pada tabel <code className="px-1.5 py-0.5 rounded bg-slate-200/70 font-mono text-slate-800">company_aliases</code> atau jalankan sinkronisasi master data.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
