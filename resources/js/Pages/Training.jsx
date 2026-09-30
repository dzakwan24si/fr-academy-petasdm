import { useState, useEffect } from 'react';
import AppLayout from '../Layouts/AppLayout';
import { Head, Deferred } from '@inertiajs/react';
import FilterBar from '@/Components/ui/FilterBar';
import { ChartCard } from '@/Components/ui/ChartCard';
import { HorizontalBar } from '@/Components/charts/HorizontalBar';
import { LineTrend } from '@/Components/charts/LineTrend';
import { DonutChart } from '@/Components/charts/DonutChart';
import { StackedBar } from '@/Components/charts/StackedBar';
import { formatNumber } from '@/lib/format';
import { defaultPalette } from '@/lib/colors';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

export default function Training({ metrics, filters }) {
    const hasData = metrics && metrics.kpi && metrics.kpi.total_rows > 0;
    
    // KPI Data
    const kpi = metrics?.kpi || {};
    
    // Line Trend
    const trendData = hasData ? Object.keys(metrics.trend.hours).map(my => ({
        name: my,
        hours: metrics.trend.hours[my] || 0,
        participants: metrics.trend.participants[my] || 0
    })) : [];

    // Donuts
    const regularityData = hasData ? Object.entries(metrics.donuts.regularity).map(([name, value], i) => ({
        name, value, fill: defaultPalette[i % defaultPalette.length]
    })) : [];
    
    const sourceData = hasData ? Object.entries(metrics.donuts.source_type).map(([name, value], i) => ({
        name, value, fill: defaultPalette[i % defaultPalette.length]
    })) : [];

    // Tops
    const topTrainings = hasData ? Object.entries(metrics.top.training_names)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value).slice(0, 10) : [];
        
    const topInstructors = hasData ? Object.entries(metrics.top.instructors)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value).slice(0, 10) : [];
        
    const topLocations = hasData ? Object.entries(metrics.top.locations)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value).slice(0, 10) : [];

    // Hours By
    const formatHoursData = (obj) => Object.entries(obj)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const hoursRegion = hasData ? formatHoursData(metrics.hours_by.region) : [];
    const hoursGroup = hasData ? formatHoursData(metrics.hours_by.group) : [];
    const hoursDept = hasData ? formatHoursData(metrics.hours_by.dept).slice(0, 15) : [];
    const hoursGol = hasData ? formatHoursData(metrics.hours_by.gol) : [];
    const hoursLevel = hasData ? formatHoursData(metrics.hours_by.level) : [];
    
    const genderLevelData = hasData ? Object.entries(metrics.gender_by_level).map(([name, genders]) => ({
        name, Male: genders.Male || 0, Female: genders.Female || 0
    })) : [];

    return (
        <AppLayout title="Pelatihan">
            <Head title="Pelatihan" />
            <FilterBar />

            <Deferred data="metrics" fallback={<TrainingSkeleton />}>
                {hasData ? (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        
                        {/* Data Quality Warning */}
                        {kpi.unlinked_rows > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                <div>
                                    <h4 className="font-bold">Kualitas Data Pelatihan</h4>
                                    <p className="text-sm opacity-90">Terdapat {formatNumber(kpi.unlinked_rows)} baris data pelatihan yang NIK-nya tidak ditemukan di data master karyawan (tidak dapat dihubungkan ke demografi).</p>
                                </div>
                            </div>
                        )}

                        {/* KPIs */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <KPICard title="Total Baris" value={kpi.total_rows} />
                            <KPICard title="Peserta Unik" value={kpi.unique_participants} />
                            <KPICard title="Total Jam" value={kpi.total_hours} format="decimal" />
                            <KPICard title="Jam / Peserta" value={kpi.avg_hours_per_participant} format="decimal" />
                            <KPICard title="Total Hari" value={kpi.total_days} format="decimal" />
                            <KPICard title="Jenis Pelatihan" value={kpi.unique_trainings} />
                        </div>

                        {/* Trend */}
                        <ChartCard title="Tren Jam & Peserta Pelatihan" className="h-96">
                            <LineTrend data={trendData} xAxisKey="name" keys={['hours', 'participants']} colors={{ hours: defaultPalette[0], participants: defaultPalette[1] }} />
                        </ChartCard>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <ChartCard title="Reguler vs Non Reguler">
                                <DonutChart data={regularityData} />
                            </ChartCard>
                            <ChartCard title="Internal vs Eksternal">
                                <DonutChart data={sourceData} />
                            </ChartCard>
                            <ChartCard title="Gender x Level (Peserta)">
                                <StackedBar data={genderLevelData} keys={['Male', 'Female']} xAxisKey="name" colors={{ Male: '#3B82F6', Female: '#EC4899' }} />
                            </ChartCard>
                        </div>

                        {/* Tops */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <ChartCard title="Top 10 Pelatihan">
                                <HorizontalBar data={topTrainings} color={defaultPalette[0]} />
                            </ChartCard>
                            <ChartCard title="Top 10 Instruktur">
                                <HorizontalBar data={topInstructors} color={defaultPalette[1]} />
                            </ChartCard>
                            <ChartCard title="Top 10 Tempat">
                                <HorizontalBar data={topLocations} color={defaultPalette[2]} />
                            </ChartCard>
                        </div>
                        
                        {/* Hours Breakdowns */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ChartCard title="Total Jam per Region">
                                <HorizontalBar data={hoursRegion} color={defaultPalette[3]} />
                            </ChartCard>
                            <ChartCard title="Total Jam per Group">
                                <HorizontalBar data={hoursGroup} color={defaultPalette[4]} />
                            </ChartCard>
                            <ChartCard title="Total Jam per Departemen (Top 15)" className="h-full" height="flex-1 min-h-[500px]">
                                <HorizontalBar data={hoursDept} color={defaultPalette[5]} />
                            </ChartCard>
                            <div className="grid grid-rows-2 gap-6">
                                <ChartCard title="Total Jam - Golongan">
                                    <HorizontalBar data={hoursGol} color={defaultPalette[0]} />
                                </ChartCard>
                                <ChartCard title="Total Jam - Level">
                                    <HorizontalBar data={hoursLevel} color={defaultPalette[1]} />
                                </ChartCard>
                            </div>
                        </div>

                        {/* Datatable */}
                        <TrainingTable filters={filters} />
                        
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

function KPICard({ title, value, format = 'number' }) {
    const formatted = format === 'number' ? formatNumber(value) : value.toLocaleString('id-ID');
    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
            <p className="text-2xl font-bold text-corporate-dark mt-2">{formatted}</p>
        </div>
    );
}

function TrainingTable({ filters }) {
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('year');
    const [dir, setDir] = useState('desc');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        // Build query string
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        params.append('page', page);
        params.append('sort', sort);
        params.append('direction', dir);
        
        // Append active filters
        Object.entries(filters || {}).forEach(([k, v]) => {
            if (Array.isArray(v)) {
                v.forEach(val => params.append(`${k}[]`, val));
            } else if (v) {
                params.append(k, v);
            }
        });

        axios.get(`/data/trainings?${params.toString()}`).then(res => {
            setData(res.data.data);
            setLastPage(res.data.last_page);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [page, search, sort, dir, filters]);

    const handleSort = (field) => {
        if (sort === field) {
            setDir(dir === 'asc' ? 'desc' : 'asc');
        } else {
            setSort(field);
            setDir('asc');
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-800">Daftar Pelatihan</h3>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Cari nama pelatihan..." 
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-corporate-light/20"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>
            
            <div className="overflow-x-auto relative min-h-[300px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                        <div className="w-8 h-8 border-4 border-corporate-light border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="text-xs uppercase bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('training_name')}>
                                <div className="flex items-center gap-1">Pelatihan {sort==='training_name' && (dir==='asc'?<ChevronUp size={14}/>:<ChevronDown size={14}/>)}</div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('month')}>
                                <div className="flex items-center gap-1">Bulan {sort==='month' && (dir==='asc'?<ChevronUp size={14}/>:<ChevronDown size={14}/>)}</div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 text-right" onClick={() => handleSort('participants')}>
                                <div className="flex items-center justify-end gap-1">Peserta {sort==='participants' && (dir==='asc'?<ChevronUp size={14}/>:<ChevronDown size={14}/>)}</div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 text-right" onClick={() => handleSort('total_hours')}>
                                <div className="flex items-center justify-end gap-1">Total Jam {sort==='total_hours' && (dir==='asc'?<ChevronUp size={14}/>:<ChevronDown size={14}/>)}</div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('source_type')}>
                                <div className="flex items-center gap-1">Tipe {sort==='source_type' && (dir==='asc'?<ChevronUp size={14}/>:<ChevronDown size={14}/>)}</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.length > 0 ? data.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4 font-medium text-gray-900">{row.training_name}</td>
                                <td className="px-6 py-4">{row.month}/{row.year}</td>
                                <td className="px-6 py-4 text-right">{formatNumber(row.participants)}</td>
                                <td className="px-6 py-4 text-right">{formatNumber(row.total_hours)}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${row.source_type === 'Internal' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                        {row.source_type || 'Unknown'}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                    {!loading && "Tidak ada data pelatihan ditemukan."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">Halaman {page} dari {lastPage}</span>
                <div className="flex gap-2">
                    <button 
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >Sebelumnya</button>
                    <button 
                        disabled={page === lastPage || lastPage === 0}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >Selanjutnya</button>
                </div>
            </div>
        </div>
    );
}

function TrainingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl" />)}
            </div>
            <div className="h-96 bg-gray-100 animate-pulse rounded-2xl" />
        </div>
    );
}
