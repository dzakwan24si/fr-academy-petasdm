import AppLayout from '../Layouts/AppLayout';
import { Head, Deferred } from '@inertiajs/react';
import FilterBar from '@/Components/ui/FilterBar';
import { ChartCard } from '@/Components/ui/ChartCard';
import { HorizontalBar } from '@/Components/charts/HorizontalBar';
import { Treemap } from '@/Components/charts/Treemap';
import { Histogram } from '@/Components/charts/Histogram';
import { PopulationPyramid } from '@/Components/charts/PopulationPyramid';
import { Heatmap } from '@/Components/charts/Heatmap';
import { StackedBar } from '@/Components/charts/StackedBar';
import { DonutChart } from '@/Components/charts/DonutChart';
import { formatNumber } from '@/lib/format';
import { defaultPalette } from '@/lib/colors';

export default function Demographics({ metrics }) {
    const hasData = metrics && metrics.total_hc > 0;
    
    // Derived datasets
    const groupData = hasData ? Object.entries(metrics.hc_by_group)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value) : [];
        
    const regionData = hasData ? Object.entries(metrics.hc_by_region)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value) : [];

    const deptData = hasData ? Object.entries(metrics.hc_by_dept)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value) : [];
        
    // Treemap structure: root with children
    const deptTreemapData = hasData ? [{
        name: 'Departments',
        children: deptData
    }] : [];

    // Histogram data (Age)
    const ageBins = ['<25', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55+'];
    const ageDistData = hasData ? ageBins.map(bin => ({
        name: bin,
        value: metrics.age_distribution[bin] || 0
    })) : [];

    // Population Pyramid (Age x Gender)
    const popPyramidData = hasData ? ageBins.map(bin => ({
        name: bin,
        Male: (metrics.population_pyramid[bin]?.Male || 0) * -1, // Negative for left side
        Female: metrics.population_pyramid[bin]?.Female || 0
    })) : [];

    // Heatmap (Gen x Region)
    const regionNames = hasData ? Object.keys(metrics.hc_by_region).sort() : [];
    const genNames = ['Boomers', 'Gen X', 'Gen Y', 'Gen Z'];
    const heatmapData = hasData ? regionNames.flatMap(region => 
        genNames.map(gen => ({
            y: region,
            x: gen,
            value: metrics.gen_by_region[region]?.[gen] || 0
        }))
    ) : [];

    // Avg Age by Dept
    const avgAgeDeptData = hasData ? Object.entries(metrics.avg_age_by_dept)
        .map(([name, value]) => ({ name, value }))
        .slice(0, 15) : [];

    // HC per level
    const levelOrder = hasData && metrics.level_order ? metrics.level_order : [];
    const levelData = hasData ? levelOrder.map(lvl => ({
        name: lvl,
        value: metrics.hc_by_level[lvl] || 0
    })).filter(d => d.value > 0) : [];

    // Gender by Level (Stacked)
    const genderLevelData = hasData ? levelOrder.map(lvl => ({
        name: lvl,
        Male: metrics.gender_by_level[lvl]?.Male || 0,
        Female: metrics.gender_by_level[lvl]?.Female || 0
    })).filter(d => d.Male > 0 || d.Female > 0) : [];

    // Gender Donut
    const genderData = hasData ? [
        { name: 'Laki-laki', value: Object.values(metrics.gender_by_level).reduce((sum, g) => sum + (g.Male || 0), 0), fill: '#3B82F6' },
        { name: 'Perempuan', value: Object.values(metrics.gender_by_level).reduce((sum, g) => sum + (g.Female || 0), 0), fill: '#EC4899' }
    ] : [];

    // Marital Status
    const maritalData = hasData ? Object.entries(metrics.marital_status)
        .map(([name, value], i) => ({ name, value, fill: defaultPalette[i % defaultPalette.length] }))
        .sort((a, b) => b.value - a.value) : [];

    // PTKP
    const ptkpData = hasData ? Object.entries(metrics.ptkp)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value) : [];

    // Job Titles (Top 10)
    const topJobTitles = hasData ? Object.entries(metrics.job_titles)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10) : [];

    // Birth Places (Top 10)
    const topBirthPlaces = hasData ? Object.entries(metrics.birth_places)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10) : [];

    // Employment by Region (Stacked)
    const empTypes = hasData ? [...new Set(Object.values(metrics.employment_by_region).flatMap(Object.keys))] : [];
    const empRegionData = hasData ? regionNames.map(region => {
        const row = { name: region };
        empTypes.forEach(type => {
            row[type] = metrics.employment_by_region[region]?.[type] || 0;
        });
        return row;
    }) : [];

    return (
        <AppLayout>
            <Head title="Demografi & Headcount" />
            <FilterBar />

            <Deferred data="metrics" fallback={<DemographicsSkeleton />}>
                {hasData ? (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* Section 1: HC Overview */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ChartCard title="HC per Region">
                                <HorizontalBar data={regionData} />
                            </ChartCard>
                            <ChartCard title="HC per Group">
                                <HorizontalBar data={groupData} color={defaultPalette[1]} />
                            </ChartCard>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6">
                            <ChartCard title="HC per Departemen (Treemap)" className="h-96">
                                <Treemap data={deptTreemapData} dataKey="value" nameKey="name" />
                            </ChartCard>
                        </div>

                        {/* Section 2: Age & Gender */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <ChartCard title="Distribusi Umur (Histogram)" className="lg:col-span-1">
                                <Histogram data={ageDistData} xAxisKey="name" dataKey="value" />
                            </ChartCard>
                            <ChartCard title="Piramida Umur × Gender" className="lg:col-span-2">
                                <PopulationPyramid data={popPyramidData} yAxisKey="name" leftKey="Male" rightKey="Female" />
                            </ChartCard>
                        </div>

                        {/* Section 3: Generations & Dept Age */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ChartCard title="Generasi × Region (Heatmap)">
                                <Heatmap data={heatmapData} xLabels={genNames} yLabels={regionNames} />
                            </ChartCard>
                            <ChartCard title="Rata-rata Umur per Departemen (Top 15, HC >= 5)">
                                <HorizontalBar data={avgAgeDeptData} color={defaultPalette[2]} />
                            </ChartCard>
                        </div>

                        {/* Section 4: Job Levels & Gender Details */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <ChartCard title="HC per Level Jabatan">
                                <HorizontalBar data={levelData} color={defaultPalette[3]} />
                            </ChartCard>
                            <ChartCard title="Gender per Level Jabatan" className="lg:col-span-2">
                                <StackedBar data={genderLevelData} keys={['Male', 'Female']} xAxisKey="name" colors={{ Male: '#3B82F6', Female: '#EC4899' }} />
                            </ChartCard>
                        </div>

                        {/* Section 5: Demographics Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ChartCard title="Gender">
                                <DonutChart data={genderData} colors={{ 'Laki-laki': '#3B82F6', 'Perempuan': '#EC4899' }} />
                            </ChartCard>
                            <ChartCard title="Status Pernikahan">
                                <DonutChart data={maritalData} />
                            </ChartCard>
                            <ChartCard title="PTKP">
                                <HorizontalBar data={ptkpData} color={defaultPalette[4]} />
                            </ChartCard>
                        </div>

                        {/* Section 6: Top Titles, Employment, Birth Place */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col h-80">
                                <h3 className="font-bold text-gray-800 mb-4">Top 10 Jabatan (HC)</h3>
                                <div className="space-y-3 overflow-y-auto pr-2">
                                    {topJobTitles.map((jt, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                                            <span className="text-gray-700 truncate mr-2">{jt.name}</span>
                                            <span className="font-semibold text-gray-900 bg-gray-50 px-2 py-0.5 rounded">{formatNumber(jt.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <ChartCard title="Status Karyawan per Region">
                                <StackedBar data={empRegionData} keys={empTypes} xAxisKey="name" />
                            </ChartCard>
                            
                            <ChartCard title="Top 10 Tempat Lahir">
                                <HorizontalBar data={topBirthPlaces} color={defaultPalette[5]} />
                            </ChartCard>
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

function DemographicsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80 bg-gray-100 animate-pulse rounded-2xl" />
                <div className="h-80 bg-gray-100 animate-pulse rounded-2xl" />
            </div>
            <div className="h-96 bg-gray-100 animate-pulse rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="h-80 bg-gray-100 animate-pulse rounded-2xl" />
                <div className="h-80 bg-gray-100 animate-pulse rounded-2xl lg:col-span-2" />
            </div>
        </div>
    );
}
