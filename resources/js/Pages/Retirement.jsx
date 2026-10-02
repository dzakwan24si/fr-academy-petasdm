import AppLayout from '../Layouts/AppLayout';
import { Head, Deferred, Link } from '@inertiajs/react';
import FilterBar from '@/Components/ui/FilterBar';
import { ChartCard } from '@/Components/ui/ChartCard';
import { HorizontalBar } from '@/Components/charts/HorizontalBar';
import { Histogram } from '@/Components/charts/Histogram';
import { defaultPalette } from '@/lib/colors';
import { formatNumber } from '@/lib/format';
import { useCopyAsImage } from '@/hooks/useCopyAsImage';
import { CopyButton } from '@/Components/ui/CopyButton';

function RetirementSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-96 bg-gray-200 rounded-2xl"></div>
                <div className="h-96 bg-gray-200 rounded-2xl"></div>
            </div>
        </div>
    );
}

function HeatCell({ pct }) {
    // Heat colors: Green < 10, Yellow 10-25, Orange 25-50, Red > 50
    let bg = 'bg-gray-100';
    let text = 'text-gray-800';
    
    if (pct > 50) {
        bg = 'bg-red-600'; text = 'text-white';
    } else if (pct > 25) {
        bg = 'bg-orange-500'; text = 'text-white';
    } else if (pct > 10) {
        bg = 'bg-amber-500'; text = 'text-white';
    } else if (pct > 0) {
        bg = 'bg-green-600'; text = 'text-white';
    }

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
            {pct}%
        </span>
    );
}

export default function Retirement({ metrics }) {
    const hasData = metrics && metrics.tables;

    const projData = hasData ? Object.entries(metrics.projection).map(([year, value]) => ({ name: year, value })) : [];
    
    const regBarData = hasData ? Object.entries(metrics.bars.region).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value) : [];
    
    const compBarData = hasData ? Object.entries(metrics.bars.company).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 10) : [];

    const { ref: levelRef, isCopying: levelCopying, status: levelStatus, handleCopy: handleLevelCopy } = useCopyAsImage({ title: 'Risiko per Level Jabatan' });

    return (
        <AppLayout title="Risiko Pensiun">
            <Head title="Risiko Pensiun" />

            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Risiko Pensiun</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Analisis karyawan yang mendekati usia pensiun (55 tahun).
                    </p>
                </div>
                <div>
                    <Link 
                        href="/karyawan" 
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Lihat Daftar Karyawan
                    </Link>
                </div>
            </div>

            <FilterBar />

            <Deferred data="metrics" fallback={<RetirementSkeleton />}>
                {hasData ? (
                    <div className="space-y-6 animate-in fade-in duration-500 mt-6">
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <p className="text-sm font-medium text-gray-500">Berisiko Sekarang</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(metrics.kpi.now)}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <p className="text-sm font-medium text-gray-500">Pensiun ≤ 1 Tahun</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(metrics.kpi['1_year'])}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <p className="text-sm font-medium text-gray-500">Pensiun ≤ 3 Tahun</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(metrics.kpi['3_years'])}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <p className="text-sm font-medium text-gray-500">Pensiun ≤ 5 Tahun</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(metrics.kpi['5_years'])}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ChartCard title="Proyeksi Pensiun (Tahun Berjalan + 5 Tahun)">
                                <Histogram data={projData} xAxisKey="name" dataKey="value" color={defaultPalette[4]} />
                            </ChartCard>
                            
                            <ChartCard title="Risiko Pensiun per Region (HC)">
                                <HorizontalBar data={regBarData} color={defaultPalette[5]} />
                            </ChartCard>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div ref={levelRef} className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(6,78,59,0.08)] border-0 relative transition-all duration-300 [@media(hover:hover)]:hover:shadow-[0_8px_30px_rgba(6,78,59,0.12)] [@media(hover:hover)]:hover:-translate-y-1">
                                <CopyButton handleCopy={handleLevelCopy} status={levelStatus} isCopying={levelCopying} />
                                <h3 className="font-bold text-gray-800 pb-3 mb-4 pr-12 border-b border-gray-100/60">Risiko per Level Jabatan</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                            <tr>
                                                <th className="px-4 py-3 rounded-tl-lg">Level</th>
                                                <th className="px-4 py-3 text-right">Total HC</th>
                                                <th className="px-4 py-3 text-right">Berisiko</th>
                                                <th className="px-4 py-3 rounded-tr-lg text-right">Persentase</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {metrics.tables.level.map(row => (
                                                <tr key={row.name} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                                                    <td className="px-4 py-3 text-right">{formatNumber(row.total)}</td>
                                                    <td className="px-4 py-3 text-right text-red-600 font-medium">{formatNumber(row.value)}</td>
                                                    <td className="px-4 py-3 text-right"><HeatCell pct={row.pct} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-4">Risiko per Departemen</h3>
                                <div className="overflow-x-auto h-[350px] overflow-y-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3">Departemen</th>
                                                <th className="px-4 py-3 text-right">Berisiko</th>
                                                <th className="px-4 py-3 text-right">Persentase</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {metrics.tables.dept.map(row => (
                                                <tr key={row.name} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[200px]" title={row.name}>{row.name}</td>
                                                    <td className="px-4 py-3 text-right text-red-600 font-medium">{formatNumber(row.value)}</td>
                                                    <td className="px-4 py-3 text-right"><HeatCell pct={row.pct} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ChartCard title="Risiko per Perusahaan (Top 10)">
                                <HorizontalBar data={compBarData} color={defaultPalette[6]} />
                            </ChartCard>
                            
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-1">Posisi Terkonsentrasi Risiko</h3>
                                <p className="text-xs text-gray-500 mb-4">Posisi (Job Title) dengan karyawan berusia &ge; (Usia Pensiun - 3).</p>
                                <div className="overflow-x-auto h-[320px] overflow-y-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3">Job Title</th>
                                                <th className="px-4 py-3 text-right">Total HC</th>
                                                <th className="px-4 py-3 text-right">Berisiko (&le;3th)</th>
                                                <th className="px-4 py-3 text-right">%</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {metrics.tables.concentrated.map(row => (
                                                <tr key={row.title} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[200px]" title={row.title}>{row.title}</td>
                                                    <td className="px-4 py-3 text-right">{formatNumber(row.total)}</td>
                                                    <td className="px-4 py-3 text-right text-orange-600 font-medium">{formatNumber(row.risk)}</td>
                                                    <td className="px-4 py-3 text-right"><HeatCell pct={row.pct} /></td>
                                                </tr>
                                            ))}
                                            {metrics.tables.concentrated.length === 0 && (
                                                <tr><td colSpan="4" className="text-center py-4 text-gray-500">Tidak ada posisi terkonsentrasi</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm mt-6">
                        <h3 className="text-lg font-medium text-gray-900">Tidak Ada Data</h3>
                        <p className="text-sm text-gray-500 mt-1">Sesuaikan filter Anda untuk melihat data.</p>
                    </div>
                )}
            </Deferred>
        </AppLayout>
    );
}
