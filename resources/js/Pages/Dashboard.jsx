import AppLayout from '../Layouts/AppLayout';
import { Head, Deferred } from '@inertiajs/react';
import FilterBar from '@/Components/ui/FilterBar';
import { KpiCard } from '@/Components/ui/KpiCard';
import { ChartCard } from '@/Components/ui/ChartCard';
import { DonutChart } from '@/Components/charts/DonutChart';
import { StackedBar } from '@/Components/charts/StackedBar';
import { HorizontalBar } from '@/Components/charts/HorizontalBar';
import { LineTrend } from '@/Components/charts/LineTrend';
import { RegionalMapWidget } from '@/Components/charts/RegionalMapWidget';
import { generationColors } from '@/lib/colors';
import { formatNumber } from '@/lib/format';
import { InfoTooltip } from '@/Components/ui/InfoTooltip';
import { UserPlus, UserCheck } from 'lucide-react';
import { useCopyAsImage } from '@/hooks/useCopyAsImage';
import { CopyButton } from '@/Components/ui/CopyButton';
import { useCrossFilter } from '@/hooks/useCrossFilter';
import { useFilters } from '@/hooks/useFilters';

export default function Dashboard({ metrics, insight }) {
    
    const { toggleFilter } = useCrossFilter();
    const { options } = useFilters();
    
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
            name: `Level ${level}`,
            level,
            top_titles: metrics.titles_by_level?.[level] || {},
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
        
    const facilityData = hasData ? [
        { name: 'Estate', value: Object.values(metrics.hc_by_region_facility || {}).reduce((s, r) => s + (r.Estate || 0), 0), fill: '#111827' },
        { name: 'Mill', value: Object.values(metrics.hc_by_region_facility || {}).reduce((s, r) => s + (r.Mill || 0), 0), fill: '#22c55e' },
        { name: 'HO', value: Object.values(metrics.hc_by_region_facility || {}).reduce((s, r) => s + (r.HO || 0), 0), fill: '#f59e0b' },
    ] : [];
        
    const trainingTrendData = hasData && metrics.training?.trend ? Object.entries(metrics.training.trend).map(([my, val]) => ({
        name: my, value: val
    })) : [];

    const retireRiskData = hasData ? levelOrder.map(level => {
        const pensiun = metrics.retire_risk_by_level?.[level] || 0;
        const total = metrics.hc_by_level?.[level] || 0;
        const pct = total > 0 ? (pensiun / total) * 100 : 0;
        const topTitles = metrics.titles_by_level?.[level] || {};
        return {
            name: `Level ${level}`,
            level,
            value: pensiun,
            pct: pct,
            total: total,
            top_titles: topTitles,
            total_titles: Object.keys(topTitles).length
        };
    }).filter(row => row.total > 0).sort((a, b) => b.pct - a.pct) : [];

    const { ref: sectionRef, isCopying, status, handleCopy } = useCopyAsImage({ title: 'Distribusi Tenaga Kerja per Operasional' });
    const { ref: retireRef, isCopying: retireCopying, status: retireStatus, handleCopy: handleRetireCopy } = useCopyAsImage({ 
        title: 'Risiko Pensiun per Level Jabatan',
        onBeforeCapture: (el) => {
            const scroller = el.querySelector('.overflow-x-auto');
            if(scroller) scroller.style.overflow = 'visible';
        },
        onAfterCapture: (el) => {
            const scroller = el.querySelector('.overflow-x-auto');
            if(scroller) scroller.style.overflow = '';
        }
    });

    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />
            
            <FilterBar />

            <Deferred data="metrics" fallback={<DashboardSkeleton />}>
                {hasData ? (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                            <KpiCard title="Total Karyawan" value={metrics.total_hc} highlight={true} />
                            <KpiCard title="Rata-rata Umur" value={metrics.avg_age} isDecimal={true} unit="Tahun" />
                            <KpiCard title="Rata-rata Masa Kerja" value={metrics.avg_los} isDecimal={true} unit="Tahun" />
                            <KpiCard title="Risiko Pensiun" value={metrics.pensiun} note="Usia >= 55 tahun" />
                            
                            <KpiCard title="Karyawan Baru Belum Dilatih (<1 Tahun)" value={metrics.new_hire_no_training || 0} note="Perlu onboarding pelatihan" icon={UserPlus} />
                            <KpiCard title="Karyawan Baru Masuk Tahun Ini" value={metrics.new_hire_this_year || 0} note={`Sejak Januari ${new Date().getFullYear()}`} icon={UserCheck} />
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
                                <DonutChart data={genData} dataKey="value" onClick={(entry) => toggleFilter('generation', entry.name)} />
                            </ChartCard>

                            <ChartCard title="Generasi per Level Jabatan" loading={!metrics} className="lg:col-span-2">
                                <StackedBar data={stackedData} keys={stackedKeys} xAxisKey="name" onClick={(key) => toggleFilter('generation', key)} />
                            </ChartCard>

                            <div ref={sectionRef} className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.08)] border-0 flex flex-col lg:flex-row gap-6 relative transition-all duration-300 [@media(hover:hover)]:hover:shadow-[0_8px_30px_rgba(6,78,59,0.12)] [@media(hover:hover)]:hover:-translate-y-1">
                                <CopyButton handleCopy={handleCopy} status={status} isCopying={isCopying} />
                                <div className="flex-1">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-gray-900">Distribusi Tenaga Kerja per Operasional</h3>
                                        <p className="text-sm text-gray-500">Estate, Mill dan Head Office</p>
                                    </div>
                                    {hasData && <RegionalMapWidget data={metrics.hc_by_region_facility} total={metrics.total_hc} />}
                                </div>
                                <div className="w-full lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-6 flex flex-col">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4">Total per Operasional</h3>
                                    <div className="flex-1 min-h-[250px]">
                                        {hasData && <DonutChart data={facilityData} dataKey="value" />}
                                    </div>
                                    <div className="mt-4 space-y-2 text-xs">
                                        {facilityData.map(item => (
                                            <div key={item.name} className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                                                    <span className="text-gray-700">{item.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-gray-900">{formatNumber(item.value)}</span>
                                                    <span className="text-gray-400 w-8 text-right">{metrics.total_hc ? Math.round((item.value/metrics.total_hc)*100) : 0}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <ChartCard title="Top 10 Perusahaan (HC)" loading={!metrics} className="lg:col-span-2">
                                <HorizontalBar 
                                    data={companyData} 
                                    dataKey="value" 
                                    yAxisKey="name" 
                                    onClick={(entry) => {
                                        const comp = options?.companies?.find(c => c.name === entry.name || c.code === entry.name);
                                        if (comp) toggleFilter('company_id', String(comp.id));
                                        else toggleFilter('company_id', entry.name);
                                    }} 
                                />
                            </ChartCard>

                            <ChartCard title="Tren Jam Pelatihan" loading={!metrics}>
                                <LineTrend data={trainingTrendData} lines={[{ dataKey: 'value', name: 'Jam', stroke: '#10B981' }]} xAxisKey="name" />
                            </ChartCard>
                            
                            {/* Table Risiko Pensiun */}
                            <div ref={retireRef} className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgba(6,78,59,0.08)] border-0 lg:col-span-3 relative transition-all duration-300 [@media(hover:hover)]:hover:shadow-[0_8px_30px_rgba(6,78,59,0.12)] [@media(hover:hover)]:hover:-translate-y-1">
                                <CopyButton handleCopy={handleRetireCopy} status={retireStatus} isCopying={retireCopying} />
                                <h3 className="font-bold text-gray-800 pb-3 mb-4 pr-12 border-b border-gray-100/60">Risiko Pensiun per Level Jabatan</h3>
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
                                                    let badgeClass = "bg-gray-200 text-gray-800";
                                                    if (row.pct > 15) badgeClass = "bg-red-600 text-white";
                                                    else if (row.pct >= 5) badgeClass = "bg-amber-500 text-white";
                                                    else if (row.pct > 0) badgeClass = "bg-green-600 text-white";

                                                    return (
                                                        <tr key={row.name} className="hover:bg-emerald-50/40 transition-colors">
                                                            <td className="px-4 py-3 text-gray-800 font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleFilter('job_level_code', row.level)}
                                                                        className="font-semibold text-gray-900 hover:text-emerald-700 transition-colors text-left"
                                                                        title={`Filter data per ${row.name}`}
                                                                    >
                                                                        {row.name}
                                                                    </button>
                                                                    {row.total_titles > 0 && (
                                                                        <InfoTooltip 
                                                                            title={`Komposisi Jabatan - ${row.name}`}
                                                                            text={
                                                                                <div className="space-y-1.5 text-xs">
                                                                                    <div className="flex items-center justify-between text-[11px] text-gray-400 pb-1 border-b border-gray-100">
                                                                                        <span>Jabatan ({row.total_titles} jenis)</span>
                                                                                        <span>Jumlah</span>
                                                                                    </div>
                                                                                    {Object.entries(row.top_titles).slice(0, 6).map(([title, count]) => (
                                                                                        <div key={title} className="flex items-center justify-between gap-3 text-gray-700">
                                                                                            <span className="truncate pr-1">{title}</span>
                                                                                            <span className="font-semibold text-gray-900 shrink-0">{formatNumber(count)}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                    {row.total_titles > 6 && (
                                                                                        <p className="text-[10px] text-emerald-700 italic pt-0.5 font-medium">
                                                                                            + {row.total_titles - 6} jabatan lainnya di level ini
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            }
                                                                        />
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-gray-600">{formatNumber(row.total)}</td>
                                                            <td className="px-4 py-3 text-right text-gray-600">{formatNumber(row.value)}</td>
                                                            <td className="px-4 py-3 text-right">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
                                                                    {row.pct.toFixed(1)}%
                                                                </span>
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
        <div className="relative overflow-hidden text-white p-6 rounded-2xl shadow-md flex gap-4 items-start bg-corporate-dark">
            {/* Background Image */}
            <div 
                className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-40"
                style={{ backgroundImage: `url('/PALM%20TREE_Panorama1.png')` }}
            />
            {/* Gradient Overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-corporate-dark/90 to-corporate/40" />
            
            <div className="p-3 bg-white/20 rounded-full shrink-0 relative z-10 backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <div className="relative z-10">
                <h3 className="text-lg font-bold mb-1 opacity-100 drop-shadow-md">Key Insight</h3>
                <p className="text-sm opacity-100 leading-relaxed font-medium drop-shadow-md">{insight}</p>
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
