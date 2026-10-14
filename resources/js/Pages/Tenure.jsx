import AppLayout from '../Layouts/AppLayout';
import { Head, Deferred } from '@inertiajs/react';
import FilterBar from '@/Components/ui/FilterBar';
import { ChartCard } from '@/Components/ui/ChartCard';
import { HorizontalBar } from '@/Components/charts/HorizontalBar';
import { Histogram } from '@/Components/charts/Histogram';
import { LineTrend } from '@/Components/charts/LineTrend';
import { Heatmap } from '@/Components/charts/Heatmap';
import { ScatterChart } from '@/Components/charts/ScatterChart';
import { defaultPalette } from '@/lib/colors';
import { formatNumber } from '@/lib/format';
import { useState } from 'react';
import { useCrossFilter } from '@/hooks/useCrossFilter';

function TenureSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-20 bg-gray-200 rounded-xl"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-96 bg-gray-200 rounded-2xl"></div>
                <div className="h-96 bg-gray-200 rounded-2xl"></div>
            </div>
        </div>
    );
}

export default function Tenure({ metrics }) {
    const { toggleFilter } = useCrossFilter();
    const hasData = metrics && metrics.histogram && Object.keys(metrics.histogram).length > 0;
    const [trendType, setTrendType] = useState('yearly');

    const histogramData = hasData ? Object.entries(metrics.histogram).map(([name, value]) => ({ name, value })) : [];
    
    const trendData = hasData ? Object.entries(metrics.trend[trendType]).map(([name, value]) => ({ name, value })) : [];
    
    const avgLevelData = hasData ? Object.entries(metrics.average.level).map(([lvl, value]) => ({ 
        name: `Level ${lvl}`, 
        level: lvl,
        value: typeof value === 'number' ? Math.round(value * 10) / 10 : value 
    })) : [];
    
    const avgRegionData = hasData ? Object.entries(metrics.average.region).map(([name, value]) => ({ name, value })) : [];
    
    const regionNames = hasData ? Array.from(new Set(
        Object.values(metrics.heatmap).flatMap(r => Object.keys(r))
    )).sort() : [];
    
    const yearNames = hasData ? Object.keys(metrics.heatmap).sort() : [];

    const heatmapData = hasData ? yearNames.flatMap(year => 
        regionNames.map(region => ({
            x: year,
            y: region,
            value: metrics.heatmap[year]?.[region] || 0
        }))
    ) : [];

    const scatterData = hasData ? metrics.scatter : [];
    const wavesData = hasData ? metrics.waves : [];

    return (
        <AppLayout title="Masa Kerja & Rekrutmen">
            <Head title="Masa Kerja & Rekrutmen" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Masa Kerja & Rekrutmen</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Distribusi masa bakti, pola rekrutmen, dan anomali umur bergabung.
                </p>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm flex items-center shadow-sm">
                    <span className="mr-2">ℹ️</span>
                    Turnover/resign belum dapat dianalisis karena data resign belum tersedia.
                </div>
            </div>

            <FilterBar />

            <Deferred data="metrics" fallback={<TenureSkeleton />}>
                {hasData ? (
                    <div className="space-y-6 animate-in fade-in duration-500 mt-6">
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ChartCard title="Distribusi Masa Kerja">
                                <Histogram data={histogramData} xAxisKey="name" dataKey="value" color={defaultPalette[0]} />
                            </ChartCard>
                            
                            <ChartCard 
                                title="Tren Rekrutmen Masuk"
                                action={
                                    <select 
                                        value={trendType} 
                                        onChange={(e) => setTrendType(e.target.value)}
                                        className="text-xs sm:text-sm border-gray-300 rounded-lg py-1 pl-2 pr-8 focus:ring-1 focus:ring-emerald-500 bg-white"
                                    >
                                        <option value="yearly">Per Tahun (Semua)</option>
                                        <option value="monthly">Per Bulan (3 Tahun Terakhir)</option>
                                    </select>
                                }
                            >
                                <LineTrend data={trendData} xAxisKey="name" keys={['value']} colors={{ value: defaultPalette[1] }} />
                            </ChartCard>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ChartCard title="Rata-rata Masa Kerja per Region (Tahun)">
                                <HorizontalBar data={avgRegionData} color={defaultPalette[2]} onClick={(entry) => toggleFilter('region', entry.name)} />
                            </ChartCard>
                            <ChartCard title="Rata-rata Masa Kerja per Level (Tahun)">
                                <HorizontalBar data={avgLevelData} color={defaultPalette[3]} onClick={(entry) => toggleFilter('job_level_code', entry.level || String(entry.name).replace('Level ', ''))} />
                            </ChartCard>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ChartCard title="Sebaran Umur vs Masa Kerja (Anomali)">
                                <ScatterChart data={scatterData} xKey="umur" yKey="masa_kerja" zKey="anomali" xLabel="Umur" yLabel="Masa Kerja" />
                            </ChartCard>
                            
                            <ChartCard title="Heatmap Rekrutmen (Tahun x Region)" height="h-auto">
                                {heatmapData.length > 0 ? (
                                    <Heatmap data={heatmapData} xLabels={yearNames} yLabels={regionNames} title="Heatmap Rekrutmen (Tahun × Region)" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">Tidak ada data</div>
                                )}
                            </ChartCard>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4">Gelombang Rekrutmen (Top 15 Tahun)</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tl-lg">Tahun Join</th>
                                            <th className="px-4 py-3 text-right">Headcount Masuk</th>
                                            <th className="px-4 py-3 rounded-tr-lg">Tipe Karyawan Dominan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {wavesData.map(row => (
                                            <tr key={row.year} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-900">{row.year}</td>
                                                <td className="px-4 py-3 text-right">{formatNumber(row.total)}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-100">
                                                        {row.dominant_type}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
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
