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
import { Calendar, TrendingUp, Users } from 'lucide-react';

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
    const { toggleFilter, hasFilter } = useCrossFilter();
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

    const maxWaveTotal = hasData && wavesData.length > 0 
        ? Math.max(...wavesData.map(w => w.total), 1) 
        : 1;
    const totalWaveHC = hasData && wavesData.length > 0
        ? wavesData.reduce((acc, w) => acc + w.total, 0)
        : 0;
    const peakWave = hasData && wavesData.length > 0
        ? wavesData.reduce((max, w) => (w.total > (max?.total || 0) ? w : max), null)
        : null;

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

                        {/* Section: Gelombang Rekrutmen (Top 15 Tahun) - Cohort Cards */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            {/* Header Toolbar */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-emerald-50 text-[#004D40] rounded-xl">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-900 text-lg">Gelombang Rekrutmen (Top 15 Tahun)</h3>
                                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                                                {wavesData.length} Angkatan
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Distribusi personil masuk dan status kepegawaian dominan per angkatan (cohort). Klik kartu tahun untuk memfilter dashboard.
                                        </p>
                                    </div>
                                </div>

                                {/* Summary KPI Pills */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-gray-100 text-xs flex items-center gap-1.5 text-gray-700 font-medium">
                                        <Users size={13} className="text-gray-400" />
                                        <span>Total:</span>
                                        <span className="font-bold text-gray-900">{formatNumber(totalWaveHC)} orang</span>
                                    </div>
                                    {peakWave && (
                                        <div className="px-3 py-1.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs flex items-center gap-1.5 text-amber-900 font-medium">
                                            <TrendingUp size={13} className="text-amber-600" />
                                            <span>Puncak:</span>
                                            <span className="font-bold text-amber-950">Tahun {peakWave.year} ({formatNumber(peakWave.total)} org)</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cohort Cards Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                                {wavesData.map((row) => {
                                    const isPeak = peakWave && row.year === peakWave.year;
                                    const pct = Math.round((row.total / maxWaveTotal) * 100);
                                    const isSelected = hasFilter ? hasFilter('year', row.year) : false;
                                    const isProbation = row.dominant_type === 'PROBATION';
                                    const isPermanent = row.dominant_type === 'PERMANENT';

                                    const typesBreakdown = row.types 
                                        ? Object.entries(row.types).map(([t, c]) => `${t}: ${c}`).join(', ') 
                                        : row.dominant_type;

                                    return (
                                        <div
                                            key={row.year}
                                            onClick={() => toggleFilter('year', row.year)}
                                            className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                                                isSelected
                                                    ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                                                    : 'bg-white hover:bg-slate-50/70 border-gray-200/70 hover:border-emerald-300 shadow-2xs hover:shadow-sm'
                                            }`}
                                            title={`Tahun ${row.year}: ${formatNumber(row.total)} orang (${typesBreakdown}). Klik untuk filter.`}
                                        >
                                            {/* Top row: Year & Badge */}
                                            <div className="flex items-center justify-between gap-1.5 mb-2">
                                                <span className="font-bold text-gray-900 text-base group-hover:text-emerald-700 transition-colors">
                                                    {row.year}
                                                </span>
                                                {isPeak ? (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 inline-flex items-center gap-0.5 shrink-0">
                                                        <TrendingUp size={10} /> Terbanyak
                                                    </span>
                                                ) : isSelected ? (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
                                                        Terpilih
                                                    </span>
                                                ) : null}
                                            </div>

                                            {/* Middle: Headcount number + Mini visual bar */}
                                            <div className="my-1.5">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-gray-900 group-hover:text-emerald-950 transition-colors tracking-tight">
                                                        {formatNumber(row.total)}
                                                    </span>
                                                    <span className="text-xs text-gray-500 font-medium">orang</span>
                                                </div>

                                                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                            isPeak 
                                                                ? 'bg-gradient-to-r from-amber-500 to-emerald-600' 
                                                                : isSelected 
                                                                    ? 'bg-[#004D40]' 
                                                                    : 'bg-emerald-600/70 group-hover:bg-[#004D40]'
                                                        }`}
                                                        style={{ width: `${Math.max(pct, 8)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Bottom: Dominant type badge */}
                                            <div className="pt-2.5 mt-2 border-t border-gray-100 flex items-center justify-between gap-1">
                                                <span className="text-[11px] text-gray-400 font-normal">Dominan:</span>
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border truncate max-w-[120px] ${
                                                    isProbation 
                                                        ? 'bg-amber-50 text-amber-800 border-amber-200/60'
                                                        : isPermanent 
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200/60'
                                                            : 'bg-gray-50 text-gray-700 border-gray-200'
                                                }`}>
                                                    {row.dominant_type}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
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
