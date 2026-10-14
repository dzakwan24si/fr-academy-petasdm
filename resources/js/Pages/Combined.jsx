import AppLayout from '../Layouts/AppLayout';
import { Head, Deferred } from '@inertiajs/react';
import FilterBar from '@/Components/ui/FilterBar';
import { ChartCard } from '@/Components/ui/ChartCard';
import { HorizontalBar } from '@/Components/charts/HorizontalBar';
import { ScatterChart } from '@/Components/charts/ScatterChart';
import { defaultPalette } from '@/lib/colors';
import { formatNumber, formatDecimal } from '@/lib/format';
import { Info } from 'lucide-react';
import { useState } from 'react';
import { useCrossFilter } from '@/hooks/useCrossFilter';
import { useFilters } from '@/hooks/useFilters';

function CombinedSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-16 bg-blue-100 rounded-lg"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-72 bg-gray-200 rounded-2xl"></div>
                <div className="h-72 bg-gray-200 rounded-2xl"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
        </div>
    );
}

export default function Combined({ metrics }) {
    const { toggleFilter } = useCrossFilter();
    const { options } = useFilters();
    const hasData = metrics && metrics.banner;
    const [sortKey, setSortKey] = useState('coverage');
    const [sortOrder, setSortOrder] = useState('desc');

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc'); // Default to desc when changing columns
        }
    };

    const companyRanking = hasData ? [...metrics.company_ranking].sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    }) : [];

    return (
        <AppLayout title="Analisis Gabungan">
            <Head title="Analisis Gabungan" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Analisis Gabungan</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Korelasi antara demografi karyawan dan partisipasi pelatihan.
                </p>
            </div>

            <FilterBar />

            <Deferred data="metrics" fallback={<CombinedSkeleton />}>
                {hasData ? (
                    <div className="space-y-6 animate-in fade-in duration-500 mt-6">
                        
                        {/* Permanent Banner */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 shadow-sm">
                            <Info className="text-blue-600 shrink-0 mt-0.5" size={20} />
                            <div>
                                <h4 className="font-semibold text-blue-900">Data Pelatihan Terhubung (Linked)</h4>
                                <p className="text-sm text-blue-800 mt-1">
                                    Halaman ini <span className="font-bold">hanya</span> menghitung data pelatihan yang berhasil dihubungkan ke karyawan (memiliki NIK valid). 
                                    Baris training yang tidak dapat dihubungkan ke karyawan (NIK kosong, rusak, atau tidak ada di data karyawan): 
                                    <span className="font-bold ml-1">{formatNumber(metrics.banner.unlinked_count)} baris ({metrics.banner.unlinked_pct}%)</span> dari total {formatNumber(metrics.banner.total_count)} baris pelatihan.
                                </p>
                            </div>
                        </div>

                        {/* Section 1: Coverage */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ChartCard title="Coverage Pelatihan per Region (%)">
                                <HorizontalBar 
                                    data={metrics.coverage.region.map(d => ({ name: d.name, value: d.pct }))} 
                                    color={defaultPalette[0]} 
                                    onClick={(entry) => toggleFilter('region', entry.name)}
                                />
                            </ChartCard>
                            <ChartCard title="Coverage Pelatihan per Level (%)">
                                <HorizontalBar 
                                    data={metrics.coverage.level.map(d => ({ 
                                        name: String(d.name).startsWith('Level') ? d.name : `Level ${d.name}`, 
                                        level: d.name,
                                        value: d.pct,
                                        top_titles: d.top_titles,
                                    }))} 
                                    color={defaultPalette[1]} 
                                    onClick={(entry) => toggleFilter('job_level_code', entry.level || String(entry.name).replace('Level ', ''))}
                                />
                            </ChartCard>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ChartCard title="Coverage Pelatihan per Departemen (Top 10)">
                                <HorizontalBar 
                                    data={metrics.coverage.dept.slice(0, 10).map(d => ({ name: d.name, value: d.pct }))} 
                                    color={defaultPalette[2]} 
                                    onClick={(entry) => toggleFilter('organization_name', entry.name)}
                                />
                            </ChartCard>
                            <ChartCard title="Coverage Pelatihan per Perusahaan (Top 10)">
                                <HorizontalBar 
                                    data={metrics.coverage.company.slice(0, 10).map(d => ({ name: d.name, value: d.pct }))} 
                                    color={defaultPalette[3]} 
                                    onClick={(entry) => {
                                        const comp = options?.companies?.find(c => c.name === entry.name || c.code === entry.name);
                                        toggleFilter('company_id', comp ? String(comp.id) : entry.name);
                                    }}
                                />
                            </ChartCard>
                        </div>

                        {/* Section 2: Averages */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <ChartCard title="Rata-rata Jam per Generasi">
                                <HorizontalBar 
                                    data={metrics.hours.generation.map(d => ({ name: d.name, value: d.avg_hours }))} 
                                    color={defaultPalette[4]} 
                                    onClick={(entry) => toggleFilter('generation', entry.name)}
                                />
                            </ChartCard>
                            <ChartCard title="Rata-rata Jam per Level">
                                <HorizontalBar 
                                    data={metrics.hours.level.map(d => ({ 
                                        name: String(d.name).startsWith('Level') ? d.name : `Level ${d.name}`, 
                                        level: d.name,
                                        value: d.avg_hours,
                                        top_titles: d.top_titles,
                                    }))} 
                                    color={defaultPalette[5]} 
                                    onClick={(entry) => toggleFilter('job_level_code', entry.level || String(entry.name).replace('Level ', ''))}
                                />
                            </ChartCard>
                            <ChartCard title="Rata-rata Jam per Gender">
                                <HorizontalBar 
                                    data={metrics.hours.gender.map(d => ({ name: d.name, value: d.avg_hours }))} 
                                    color={defaultPalette[6]} 
                                    onClick={(entry) => toggleFilter('gender', entry.name)}
                                />
                            </ChartCard>
                        </div>

                        {/* Section 3: Risk & Tenure */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full flex flex-col justify-center">
                                    <h3 className="font-bold text-gray-800 mb-2">Karyawan Baru (&lt; 1 Tahun)</h3>
                                    <p className="text-sm text-gray-500 mb-4">Yang belum tercatat mengikuti pelatihan sama sekali.</p>
                                    <p className="text-4xl font-bold text-red-600">{formatNumber(metrics.new_hire_no_training)} <span className="text-base font-normal text-gray-600">orang</span></p>
                                </div>
                            </div>
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
                                    <h3 className="font-bold text-gray-800 mb-4">Karyawan Berisiko Pensiun vs Pelatihan</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                                <tr>
                                                    <th className="px-4 py-3 rounded-tl-lg">Kategori Pelatihan</th>
                                                    <th className="px-4 py-3 text-right rounded-tr-lg">Jumlah Karyawan Berisiko</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                <tr className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-gray-900">Belum ada pelatihan (0 jam)</td>
                                                    <td className="px-4 py-3 text-right text-red-600 font-bold">{formatNumber(metrics.retirement_training['0_jam'])}</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-gray-900">1 - 15 jam</td>
                                                    <td className="px-4 py-3 text-right">{formatNumber(metrics.retirement_training['1_15_jam'])}</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-gray-900">16+ jam</td>
                                                    <td className="px-4 py-3 text-right text-green-600 font-bold">{formatNumber(metrics.retirement_training['16_plus_jam'])}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Scatter */}
                        <div className="grid grid-cols-1 gap-6">
                            <ChartCard title="Korelasi Masa Kerja vs Total Jam Pelatihan" height="h-96">
                                <ScatterChart data={metrics.scatter} xKey="masa_kerja" yKey="jam_pelatihan" zKey="none" xLabel="Masa Kerja" yLabel="Total Jam Pelatihan" />
                            </ChartCard>
                        </div>

                        {/* Section 5: Company Ranking */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4">Peringkat Kinerja Perusahaan</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('name')}>
                                                Perusahaan {sortKey === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('hc')}>
                                                Total HC {sortKey === 'hc' && (sortOrder === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('avg_age')}>
                                                Rata Umur {sortKey === 'avg_age' && (sortOrder === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('coverage')}>
                                                Coverage (%) {sortKey === 'coverage' && (sortOrder === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('avg_hours')}>
                                                Jam/Org {sortKey === 'avg_hours' && (sortOrder === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('risk_pct')}>
                                                Risiko Pensiun (%) {sortKey === 'risk_pct' && (sortOrder === 'asc' ? '↑' : '↓')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {companyRanking.map(row => (
                                            <tr key={row.name} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                                                <td className="px-4 py-3 text-right">{formatNumber(row.hc)}</td>
                                                <td className="px-4 py-3 text-right">{formatDecimal(row.avg_age)}</td>
                                                <td className="px-4 py-3 text-right font-medium text-blue-600">{formatDecimal(row.coverage)}%</td>
                                                <td className="px-4 py-3 text-right">{formatDecimal(row.avg_hours)}</td>
                                                <td className="px-4 py-3 text-right">{formatDecimal(row.risk_pct)}%</td>
                                            </tr>
                                        ))}
                                        {companyRanking.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="text-center py-6 text-gray-500">Tidak ada data</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
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
