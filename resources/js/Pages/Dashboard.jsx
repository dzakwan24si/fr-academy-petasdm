import AppLayout from '../Layouts/AppLayout';
import { Head, Deferred } from '@inertiajs/react';
import FilterBar from '@/Components/ui/FilterBar';
import { KpiCard } from '@/Components/ui/KpiCard';
import { ChartCard } from '@/Components/ui/ChartCard';
import { DonutChart } from '@/Components/charts/DonutChart';
import { StackedBar } from '@/Components/charts/StackedBar';
import { HorizontalBar } from '@/Components/charts/HorizontalBar';
import { LineTrend } from '@/Components/charts/LineTrend';
import { generationColors } from '@/lib/colors';
import { formatNumber } from '@/lib/format';
import { levelLabels } from '@/lib/constants';

export default function Dashboard({ metrics, insight }) {
    
    // Transform metrics for charts
    const hasData = metrics && metrics.total_hc > 0;
    
    const genData = hasData ? Object.entries(metrics.generations).map(([name, value]) => ({
        name, value, fill: generationColors[name] || '#ccc'
    })) : [];

    const stackedKeys = ['Boomers', 'Gen X', 'Gen Y', 'Gen Z'];
    const levelOrder = hasData && metrics.level_order ? metrics.level_order : [];

    const stackedData = hasData ? levelOrder.map(level => {
        const gens = metrics.generations_by_level?.[level] || {};
        return {
            name: levelLabels[level] ? `${level} - ${levelLabels[level]}` : level,
            ...gens
        };
    }) : [];

    const regionData = hasData ? Object.entries(metrics.hc_by_region)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value) : [];

    const companyData = hasData ? Object.entries(metrics.hc_by_company)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10) : [];
        
    const trainingTrendData = hasData && metrics.training?.trend ? Object.entries(metrics.training.trend).map(([my, val]) => ({
        name: my, value: val
    })) : [];

    const retireRiskData = hasData ? levelOrder.map(level => {
        const pensiun = metrics.retire_risk_by_level?.[level] || 0;
        const total = metrics.hc_by_level?.[level] || 0;
        const pct = total > 0 ? (pensiun / total) * 100 : 0;
        return {
            name: levelLabels[level] ? `${level} - ${levelLabels[level]}` : level,
            value: pensiun,
            pct: pct,
            total: total
        };
    }).filter(row => row.total > 0).sort((a, b) => b.pct - a.pct) : [];

    return (
        <AppLayout>
            <Head title="Dashboard" />
            
            <FilterBar />

            <Deferred data="metrics" fallback={<DashboardSkeleton />}>
                {hasData ? (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* KPI Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <KpiCard title="Total Karyawan" value={metrics.total_hc} highlight={true} />
                            <KpiCard title="Rata-rata Umur" value={metrics.avg_age} isDecimal={true} unit="Tahun" />
                            <KpiCard title="Rata-rata Masa Kerja" value={metrics.avg_los} isDecimal={true} unit="Tahun" />
                            <KpiCard title="Risiko Pensiun" value={metrics.pensiun} note="Usia >= 55 tahun" />
                            
                            <KpiCard title="% Gen Y + Z" value={roundPct((metrics.generations['Gen Y'] || 0) + (metrics.generations['Gen Z'] || 0), metrics.total_hc)} isDecimal={true} unit="%" />
                            <KpiCard title="% Perempuan" value={metrics.female_pct} isDecimal={true} unit="%" />
                            <KpiCard title="Total Jam Pelatihan" value={metrics.training?.total_hours || 0} isDecimal={true} unit="Jam" secondaryText={`Unlinked: ${metrics.training?.unlinked_rows || 0}`} />
                            <KpiCard title="Training Coverage" value={metrics.training?.coverage_pct || 0} isDecimal={true} unit="%" />
                        </div>

                        {/* Insight Builder Card */}
                        <Deferred data="insight" fallback={<div className="h-16 bg-gray-50 rounded animate-pulse"></div>}>
                            <InsightCard insight={insight} />
                        </Deferred>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <ChartCard title="Komposisi Generasi" loading={!metrics}>
                                <DonutChart data={genData} dataKey="value" />
                            </ChartCard>

                            <ChartCard title="Generasi per Level Jabatan" loading={!metrics} className="lg:col-span-2">
                                <StackedBar data={stackedData} keys={stackedKeys} xAxisKey="name" />
                            </ChartCard>

                            <ChartCard title="Headcount per Region" loading={!metrics}>
                                <HorizontalBar data={regionData} dataKey="value" yAxisKey="name" />
                            </ChartCard>

                            <ChartCard title="Top 10 Perusahaan (HC)" loading={!metrics}>
                                <HorizontalBar data={companyData} dataKey="value" yAxisKey="name" />
                            </ChartCard>

                            <ChartCard title="Tren Jam Pelatihan" loading={!metrics}>
                                <LineTrend data={trainingTrendData} lines={[{ dataKey: 'value', name: 'Jam', stroke: '#10B981' }]} xAxisKey="name" />
                            </ChartCard>
                            
                            {/* Table Risiko Pensiun */}
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 lg:col-span-3">
                                <h3 className="font-bold text-gray-800 mb-4">Risiko Pensiun per Level Jabatan</h3>
                                {retireRiskData.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-600 font-medium">
                                                <tr>
                                                    <th className="px-4 py-3 rounded-l-lg">Level Jabatan</th>
                                                    <th className="px-4 py-3 text-right">Total HC</th>
                                                    <th className="px-4 py-3 text-right">Risiko Pensiun</th>
                                                    <th className="px-4 py-3 rounded-r-lg text-right">% Risiko</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {retireRiskData.map(row => {
                                                    let colorClass = "text-gray-600";
                                                    if (row.pct > 15) colorClass = "text-red-600 font-bold bg-red-50";
                                                    else if (row.pct >= 5) colorClass = "text-amber-600 font-bold bg-amber-50";
                                                    else if (row.pct > 0) colorClass = "text-green-600 font-bold bg-green-50";

                                                    return (
                                                        <tr key={row.name} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 text-gray-800 font-medium">{row.name}</td>
                                                            <td className="px-4 py-3 text-right text-gray-600">{formatNumber(row.total)}</td>
                                                            <td className="px-4 py-3 text-right text-gray-600">{formatNumber(row.value)}</td>
                                                            <td className={`px-4 py-3 text-right rounded ${colorClass}`}>
                                                                {row.pct.toFixed(1)}%
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-sm text-gray-500">Tidak ada risiko pensiun di filter ini.</div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm mt-6">
                        <div className="text-gray-400 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Tidak Ada Data</h3>
                        <p className="text-sm text-gray-500 mt-1">Sesuaikan filter Anda untuk melihat data.</p>
                    </div>
                )}
            </Deferred>
        </AppLayout>
    );
}

function roundPct(val, total) {
    if (!total) return 0;
    return (val / total) * 100;
}

function InsightCard({ insight }) {
    if (!insight) return null;
    return (
        <div className="bg-gradient-to-r from-corporate-dark to-corporate text-white p-6 rounded-2xl shadow-md flex gap-4 items-start">
            <div className="p-3 bg-white/10 rounded-full shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <div>
                <h3 className="text-lg font-bold mb-1 opacity-90">Key Insight</h3>
                <p className="text-sm opacity-100 leading-relaxed font-medium">{insight}</p>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-2xl" />)}
            </div>
            <div className="h-24 bg-gray-100 animate-pulse rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="h-80 bg-gray-100 animate-pulse rounded-2xl" />
                <div className="h-80 bg-gray-100 animate-pulse rounded-2xl lg:col-span-2" />
                <div className="h-80 bg-gray-100 animate-pulse rounded-2xl" />
                <div className="h-80 bg-gray-100 animate-pulse rounded-2xl" />
                <div className="h-80 bg-gray-100 animate-pulse rounded-2xl" />
            </div>
        </div>
    );
}
