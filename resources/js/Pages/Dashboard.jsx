import AppLayout from '../Layouts/AppLayout';
import { Head, Deferred, Link } from '@inertiajs/react';
import FilterBar from '@/Components/ui/FilterBar';
import { KpiCard } from '@/Components/ui/KpiCard';
import { ChartCard } from '@/Components/ui/ChartCard';
import { DonutChart } from '@/Components/charts/DonutChart';
import { StackedBar } from '@/Components/charts/StackedBar';
import { HorizontalBar } from '@/Components/charts/HorizontalBar';
import { LineTrend } from '@/Components/charts/LineTrend';
import { generationColors } from '@/lib/colors';
import { formatNumber } from '@/lib/format';
import { InfoTooltip } from '@/Components/ui/InfoTooltip';
import { 
    UserPlus, 
    UserCheck, 
    Users, 
    GraduationCap, 
    TrendingDown, 
    TrendingUp, 
    ArrowRight, 
    Sparkles, 
    Activity 
} from 'lucide-react';
import { useCrossFilter } from '@/hooks/useCrossFilter';
import { useFilters } from '@/hooks/useFilters';

export default function Dashboard({ metrics, insight, resign_summary }) {
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
        const total = Object.values(gens).reduce((sum, val) => sum + (Number(val) || 0), 0);
        return {
            name: `Level ${level}`,
            level,
            total,
            top_titles: metrics.titles_by_level?.[level] || {},
            ...gens
        };
    }).filter(row => row.total > 0) : [];

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

    return (
        <AppLayout title="Dashboard">
            <Head title="Executive Workforce Dashboard" />
            
            <div className="space-y-6">
                {/* TOP EXECUTIVE HEADER (Flat Canvas Header) */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Executive Workforce Dashboard
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Monitoring komprehensif demografi tenaga kerja, pergerakan rekrutmen, retensi karyawan & pelatihan.
                        </p>
                    </div>
                </div>

                {/* Filter Bar */}
                <FilterBar />

                <Deferred data="metrics" fallback={<DashboardSkeleton />}>
                    {hasData ? (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            {/* KPI Grid (8 Kartu Bersatu Rapi) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                                <KpiCard title="Total Karyawan" value={metrics.total_hc} highlight={true} note="Headcount Aktif" />
                                <KpiCard title="Rata-rata Umur" value={metrics.avg_age} isDecimal={true} unit="Tahun" note="Usia Produktif" />
                                <KpiCard title="Rata-rata Masa Kerja" value={metrics.avg_los} isDecimal={true} unit="Tahun" note="Length of Service" />
                                <KpiCard 
                                    title="Turnover & Resign" 
                                    value={resign_summary?.total_curr ?? 0} 
                                    unit="Orang"
                                    note={resign_summary?.diff_pct !== undefined ? `${(resign_summary.diff_pct ?? 0) > 0 ? '+' : ''}${resign_summary.diff_pct}% YoY` : ''} 
                                    noteClass={(resign_summary?.diff ?? 0) <= 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}
                                    secondaryText={resign_summary?.vt_pct !== undefined ? `VT: ${resign_summary.vt_pct}% · IT: ${resign_summary.it_pct}%` : ''}
                                    icon={TrendingDown}
                                />
                                <KpiCard title="Karyawan Baru Masuk Tahun Ini" value={metrics.new_hire_this_year || 0} note={`Sejak Januari ${new Date().getFullYear()}`} icon={UserCheck} />
                                <KpiCard title="Karyawan Belum Pernah Training (<1 Tahun)" value={metrics.new_hire_no_training || 0} note="Perlu onboarding training" icon={UserPlus} />
                                <KpiCard title="Total Jam Pelatihan" value={metrics.training?.total_hours || 0} isDecimal={true} unit="Jam" secondaryText={`Unlinked: ${metrics.training?.unlinked_rows || 0}`} />
                                <KpiCard title="Training Coverage" value={metrics.training?.coverage_pct || 0} isDecimal={true} unit="%" />
                            </div>

                            {/* Executive Key Insight Card */}
                            <Deferred data="insight" fallback={<div className="h-20 bg-gray-50 rounded-2xl animate-pulse" />}>
                                <InsightCard insight={insight} resignInsight={resign_summary?.insights?.[0]} />
                            </Deferred>

                            {/* Section 5: Charts Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <ChartCard title="Komposisi Generasi" loading={!metrics}>
                                    <DonutChart data={genData} dataKey="value" onClick={(entry) => toggleFilter('generation', entry.name)} />
                                </ChartCard>

                                <ChartCard title="Generasi per Level Jabatan" loading={!metrics} className="lg:col-span-2">
                                    <StackedBar data={stackedData} keys={stackedKeys} xAxisKey="name" onClick={(key) => toggleFilter('generation', key)} />
                                </ChartCard>

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
            </div>
        </AppLayout>
    );
}

function InsightCard({ insight, resignInsight }) {
    if (!insight && !resignInsight) return null;
    return (
        <div className="relative overflow-hidden text-white p-5 sm:p-6 rounded-2xl shadow-sm bg-gradient-to-r from-emerald-950 via-[#004D40] to-emerald-900 border border-emerald-800/50">
            {/* Subtle light accent */}
            <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-2.5 mb-3 relative z-10">
                <div className="p-2 bg-emerald-400/20 rounded-xl text-emerald-300 shadow-2xs">
                    <Sparkles size={18} />
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-200">
                    Executive Summary & Key Insights SDM
                </h3>
            </div>
            
            <div className="space-y-2.5 relative z-10 text-xs sm:text-sm text-emerald-50/95 leading-relaxed font-medium">
                {insight && (
                    <div className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0 shadow-xs" />
                        <p>{insight}</p>
                    </div>
                )}
                {resignInsight && (
                    <div className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-300 mt-2 shrink-0 shadow-xs" />
                        <p>{resignInsight}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />)}
            </div>
            <div className="h-28 bg-gray-100 animate-pulse rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="h-80 bg-gray-100 animate-pulse rounded-2xl" />
                <div className="h-80 bg-gray-100 animate-pulse rounded-2xl lg:col-span-2" />
                <div className="h-80 bg-gray-100 animate-pulse rounded-2xl lg:col-span-2" />
                <div className="h-80 bg-gray-100 animate-pulse rounded-2xl" />
            </div>
        </div>
    );
}
