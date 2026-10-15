import { useState, useEffect } from 'react';
import AppLayout from '../Layouts/AppLayout';
import { Head, Deferred, Link } from '@inertiajs/react';
import FilterBar from '@/Components/ui/FilterBar';
import { ChartCard } from '@/Components/ui/ChartCard';
import { KpiCard } from '@/Components/ui/KpiCard';
import { HorizontalBar } from '@/Components/charts/HorizontalBar';
import { LineTrend } from '@/Components/charts/LineTrend';
import { DonutChart } from '@/Components/charts/DonutChart';
import { StackedBar } from '@/Components/charts/StackedBar';
import { formatNumber, formatDecimal } from '@/lib/format';
import { defaultPalette } from '@/lib/colors';
import { 
    Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, 
    X, GraduationCap, FileSpreadsheet, ArrowRight, 
    BarChart2, Users, Clock, Target, Calendar 
} from 'lucide-react';
import axios from 'axios';
import { useCrossFilter } from '@/hooks/useCrossFilter';

export default function Training({ metrics, filters }) {
    const { toggleFilter } = useCrossFilter();
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                            <KpiCard 
                                title="Total Baris" 
                                value={kpi.total_rows} 
                                icon={BarChart2} 
                                description="Total seluruh baris rekam data pelatihan yang tercatat dalam sistem." 
                            />
                            <KpiCard 
                                title="Peserta Unik" 
                                value={kpi.unique_participants} 
                                icon={Users} 
                                description="Jumlah individu karyawan unik yang tercatat pernah mengikuti pelatihan." 
                            />
                            <KpiCard 
                                title="Total Jam" 
                                value={kpi.total_hours} 
                                isDecimal 
                                unit="jam" 
                                icon={Clock} 
                                description="Akumulasi total jam pelatihan yang telah dilaksanakan seluruh karyawan." 
                            />
                            <KpiCard 
                                title="Jam / Peserta" 
                                value={kpi.avg_hours_per_participant} 
                                isDecimal 
                                unit="jam" 
                                icon={Target} 
                                description="Rata-rata akumulasi durasi jam pelatihan yang diterima oleh setiap peserta." 
                            />
                            <KpiCard 
                                title="Total Hari" 
                                value={kpi.total_days} 
                                isDecimal 
                                unit="hari" 
                                icon={Calendar} 
                                description="Total durasi pelaksanaan seluruh program pelatihan dalam satuan hari." 
                            />
                            <KpiCard 
                                title="Jenis Pelatihan" 
                                value={kpi.unique_trainings} 
                                icon={GraduationCap} 
                                description="Ragam topik atau judul program pelatihan yang telah diselenggarakan." 
                            />
                        </div>

                        {/* Trend */}
                        <ChartCard title="Tren Jam & Peserta Pelatihan" className="h-96">
                            <LineTrend data={trendData} xAxisKey="name" keys={['hours', 'participants']} colors={{ hours: defaultPalette[0], participants: defaultPalette[1] }} />
                        </ChartCard>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <ChartCard title="Reguler vs Non Reguler">
                                <DonutChart data={regularityData} onClick={(entry) => toggleFilter('is_regular', entry.name === 'Reguler' ? '1' : '0')} />
                            </ChartCard>
                            <ChartCard title="Internal vs Eksternal">
                                <DonutChart data={sourceData} onClick={(entry) => toggleFilter('is_internal', entry.name === 'Internal' ? '1' : '0')} />
                            </ChartCard>
                            <ChartCard title="Gender x Level (Peserta)">
                                <StackedBar data={genderLevelData} keys={['Male', 'Female']} xAxisKey="name" colors={{ Male: '#3B82F6', Female: '#EC4899' }} onClick={(key) => toggleFilter('gender', key === 'Male' ? 'Laki-laki' : 'Perempuan')} />
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
                                <HorizontalBar data={hoursRegion} color={defaultPalette[3]} onClick={(entry) => toggleFilter('region', entry.name)} />
                            </ChartCard>
                            <ChartCard title="Total Jam per Group">
                                <HorizontalBar data={hoursGroup} color={defaultPalette[4]} onClick={(entry) => toggleFilter('group', entry.name)} />
                            </ChartCard>
                            <ChartCard title="Total Jam per Departemen (Top 15)" className="h-full" height="flex-1 min-h-[500px]">
                                <HorizontalBar data={hoursDept} color={defaultPalette[5]} onClick={(entry) => toggleFilter('organization_name', entry.name)} />
                            </ChartCard>
                            <div className="grid grid-rows-2 gap-6">
                                <ChartCard title="Total Jam - Golongan">
                                    <HorizontalBar data={hoursGol} color={defaultPalette[0]} onClick={(entry) => toggleFilter('job_category', entry.name)} />
                                </ChartCard>
                                <ChartCard title="Total Jam - Level">
                                    <HorizontalBar data={hoursLevel} color={defaultPalette[1]} onClick={(entry) => toggleFilter('job_level_code', entry.name)} />
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

function TrainingTable({ filters }) {
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState({ from: 0, to: 0, total: 0, page: 1, lastPage: 1 });
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('year');
    const [dir, setDir] = useState('desc');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        params.append('page', page);
        params.append('per_page', perPage);
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
            setData(res.data.data || []);
            setMeta({
                from: res.data.from || 0,
                to: res.data.to || 0,
                total: res.data.total || 0,
                page: res.data.current_page || 1,
                lastPage: res.data.last_page || 1,
            });
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [page, perPage, search, sort, dir, filters]);

    const handleSort = (field) => {
        if (sort === field) {
            setDir(dir === 'asc' ? 'desc' : 'asc');
        } else {
            setSort(field);
            setDir('asc');
        }
        setPage(1);
    };

    const getPageNumbers = (current, total) => {
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        if (current <= 4) {
            return [1, 2, 3, 4, 5, '...', total];
        }
        if (current >= total - 3) {
            return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
        }
        return [1, '...', current - 1, current, current + 1, '...', total];
    };

    const SortIcon = ({ column }) => {
        if (sort !== column) {
            return <span className="text-gray-300 ml-1 text-xs">↕</span>;
        }
        return dir === 'asc' ? (
            <ChevronUp className="inline w-3.5 h-3.5 ml-1 text-emerald-700" />
        ) : (
            <ChevronDown className="inline w-3.5 h-3.5 ml-1 text-emerald-700" />
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            {/* Header Box / Toolbar */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-gray-50/60">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base">Daftar Pelatihan</h3>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {meta.total?.toLocaleString('id-ID')} Agenda
                        </span>
                    </div>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    <p className="text-xs text-gray-500">
                        Rekapitulasi program pelatihan dan intensitas keikutsertaan peserta.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    {/* Search */}
                    <div className="relative flex-1 sm:flex-initial sm:w-64">
                        <input 
                            type="text" 
                            placeholder="Cari nama pelatihan..." 
                            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white shadow-2xs transition-all"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        {search && (
                            <button
                                type="button"
                                onClick={() => { setSearch(''); setPage(1); }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                title="Hapus pencarian"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Per-Page Selector */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 shrink-0">
                        <span className="text-xs font-medium text-gray-500">Tampilkan:</span>
                        <select 
                            value={perPage} 
                            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                            className="border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs sm:text-sm bg-white shadow-2xs cursor-pointer font-medium"
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>

                    {/* Link ke Tabel Mentah */}
                    <Link
                        href="/pelatihan/data"
                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-[#004D40] bg-emerald-50 border border-emerald-200/80 rounded-xl hover:bg-emerald-100 transition-colors shadow-2xs shrink-0"
                        title="Buka tabel lengkap seluruh catatan peserta training"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                        <span>Data Mentah</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1 text-emerald-700" />
                    </Link>
                </div>
            </div>
            
            {/* Table Area */}
            <div className="overflow-x-auto relative min-h-[300px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center z-20">
                        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="text-xs text-gray-500 uppercase bg-slate-50/95 backdrop-blur-xs border-b border-gray-200/80 sticky top-0 z-10 shadow-2xs">
                        <tr>
                            <th 
                                className="px-5 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" 
                                onClick={() => handleSort('training_name')}
                            >
                                <div className="flex items-center gap-1">
                                    <span>Nama Pelatihan</span>
                                    <SortIcon column="training_name" />
                                </div>
                            </th>
                            <th 
                                className="px-5 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" 
                                onClick={() => handleSort('year')}
                            >
                                <div className="flex items-center gap-1">
                                    <span>Periode</span>
                                    <SortIcon column="year" />
                                </div>
                            </th>
                            <th 
                                className="px-5 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right" 
                                onClick={() => handleSort('participants')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>Peserta</span>
                                    <SortIcon column="participants" />
                                </div>
                            </th>
                            <th 
                                className="px-5 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right" 
                                onClick={() => handleSort('total_hours')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>Total Jam</span>
                                    <SortIcon column="total_hours" />
                                </div>
                            </th>
                            <th className="px-5 py-3.5 font-semibold whitespace-nowrap text-right">
                                <span>Rata-rata Jam</span>
                            </th>
                            <th 
                                className="px-5 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-center" 
                                onClick={() => handleSort('source_type')}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    <span>Tipe Sumber</span>
                                    <SortIcon column="source_type" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {data.length > 0 ? data.map((row, idx) => {
                            const avgHours = row.participants > 0 ? (row.total_hours / row.participants) : 0;
                            return (
                                <tr key={`${row.training_name}-${row.year}-${row.month}-${idx}`} className="hover:bg-emerald-50/30 transition-colors">
                                    <td className="px-5 py-3.5 font-medium text-gray-900">
                                        <span className="line-clamp-2" title={row.training_name}>
                                            {row.training_name}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-600 font-mono text-xs">
                                        {String(row.month).padStart(2, '0')}/{row.year}
                                    </td>
                                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-medium text-gray-800">
                                        {formatNumber(row.participants)}
                                    </td>
                                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-semibold text-gray-900">
                                        {formatDecimal(row.total_hours)} jam
                                    </td>
                                    <td className="px-5 py-3.5 whitespace-nowrap text-right text-gray-600 text-xs">
                                        {formatDecimal(avgHours)} jam/org
                                    </td>
                                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                            row.source_type === 'Internal' 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                                                : row.source_type === 'Eksternal'
                                                ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                                        }`}>
                                            {row.source_type || 'Unknown'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-16 text-center text-gray-500">
                                    {!loading && (
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="p-3 rounded-full bg-gray-50 text-gray-400">
                                                <GraduationCap size={24} />
                                            </div>
                                            <p className="text-base font-semibold text-gray-700">Tidak ada data pelatihan ditemukan</p>
                                            <p className="text-xs text-gray-400">Coba sesuaikan kata kunci pencarian atau filter yang aktif.</p>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination Footer */}
            {meta.total > 0 && (
                <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
                    <div className="text-xs sm:text-sm text-gray-500">
                        Menampilkan <span className="font-semibold text-gray-900">{meta.from}</span> - <span className="font-semibold text-gray-900">{meta.to}</span> dari <span className="font-semibold text-gray-900">{meta.total?.toLocaleString('id-ID')}</span> pelatihan
                    </div>

                    <div className="flex items-center flex-wrap justify-center sm:justify-end gap-1">
                        <button 
                            type="button"
                            disabled={page === 1 || loading}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="min-w-[2rem] h-8 px-2 flex items-center justify-center rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-900 cursor-pointer"
                            aria-label="Sebelumnya"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {getPageNumbers(page, meta.lastPage).map((item, idx) => (
                            item === '...' ? (
                                <span key={`ellipsis-${idx}`} className="min-w-[2rem] h-8 px-2 flex items-center justify-center text-xs text-gray-300">
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={item}
                                    type="button"
                                    disabled={loading}
                                    onClick={() => setPage(item)}
                                    className={`min-w-[2rem] h-8 px-2.5 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                        page === item
                                            ? 'bg-[#004D40] text-white shadow-2xs'
                                            : 'text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-900'
                                    }`}
                                >
                                    {item}
                                </button>
                            )
                        ))}

                        <button 
                            type="button"
                            disabled={page === meta.lastPage || meta.lastPage === 0 || loading}
                            onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))}
                            className="min-w-[2rem] h-8 px-2 flex items-center justify-center rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-900 cursor-pointer"
                            aria-label="Selanjutnya"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
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
