import AppLayout from '../Layouts/AppLayout';
import { Head, Deferred } from '@inertiajs/react';
import FilterBar from '@/Components/ui/FilterBar';
import { ChartCard } from '@/Components/ui/ChartCard';
import { HorizontalBar } from '@/Components/charts/HorizontalBar';
import { defaultPalette } from '@/lib/colors';
import { formatNumber, formatDecimal } from '@/lib/format';
import { Info, Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, X, Briefcase, Building2 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
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
    const { toggleFilter, hasFilter } = useCrossFilter();
    const { options } = useFilters();
    const hasData = metrics && metrics.banner;

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
                                    data={metrics.coverage.region.filter(d => (d.pct || 0) > 0).map(d => ({ name: d.name, value: d.pct }))} 
                                    color={defaultPalette[0]} 
                                    onClick={(entry) => toggleFilter('region', entry.name)}
                                />
                            </ChartCard>
                            <ChartCard title="Coverage Pelatihan per Level (%)">
                                <HorizontalBar 
                                    data={metrics.coverage.level.filter(d => (d.pct || 0) > 0).map(d => ({ 
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
                                    data={metrics.coverage.dept.filter(d => (d.pct || 0) > 0).slice(0, 10).map(d => ({ name: d.name, value: d.pct }))} 
                                    color={defaultPalette[2]} 
                                    onClick={(entry) => toggleFilter('organization_name', entry.name)}
                                />
                            </ChartCard>
                            <ChartCard title="Coverage Pelatihan per Perusahaan (Top 10)">
                                <HorizontalBar 
                                    data={metrics.coverage.company.filter(d => (d.pct || 0) > 0).slice(0, 10).map(d => ({ name: d.name, value: d.pct }))} 
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
                                    data={metrics.hours.generation.filter(d => (d.avg_hours || 0) > 0).map(d => ({ name: d.name, value: d.avg_hours }))} 
                                    color={defaultPalette[4]} 
                                    onClick={(entry) => toggleFilter('generation', entry.name)}
                                />
                            </ChartCard>
                            <ChartCard title="Rata-rata Jam per Level">
                                <HorizontalBar 
                                    data={metrics.hours.level.filter(d => (d.avg_hours || 0) > 0).map(d => ({ 
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
                                    data={metrics.hours.gender.filter(d => (d.avg_hours || 0) > 0).map(d => ({ name: d.name, value: d.avg_hours }))} 
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
                                    <p className="text-sm text-gray-500 mb-4">Yang belum tercatat mengikuti training sama sekali.</p>
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

                        {/* Section 4: Company Ranking */}
                        <CompanyRankingTable 
                            data={metrics.company_ranking || []}
                            onSelectCompany={(comp) => {
                                const compId = comp.id ? String(comp.id) : comp.name;
                                toggleFilter('company_id', compId);
                            }}
                            isSelectedCompany={(comp) => {
                                if (!comp) return false;
                                return hasFilter('company_id', String(comp.id)) || hasFilter('company_id', comp.name);
                            }}
                        />

                        {/* Section 6: All Job Titles Table */}
                        <JobTitlesTable 
                            data={metrics.job_titles_ranking || []} 
                            onSelectJobTitle={(title) => toggleFilter('job_title_name', title)}
                            onSelectLevel={(lvl) => toggleFilter('job_level_code', lvl)}
                        />
                        
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

function CompanyRankingTable({ data = [], onSelectCompany, isSelectedCompany }) {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState('coverage');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Filter and sort data
    const filtered = useMemo(() => {
        let result = data;

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(item => 
                item.name && String(item.name).toLowerCase().includes(q)
            );
        }

        return [...result].sort((a, b) => {
            let valA = a[sortKey];
            let valB = b[sortKey];

            if (valA === undefined || valA === null) valA = '';
            if (valB === undefined || valB === null) valB = '';

            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortOrder === 'asc' ? valA - valB : valB - valA;
            }

            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();

            const cmp = strA.localeCompare(strB, undefined, { numeric: true });
            return sortOrder === 'asc' ? cmp : -cmp;
        });
    }, [data, search, sortKey, sortOrder]);

    // Reset pagination when search or perPage changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, perPage]);

    const totalRows = filtered.length;
    const totalPages = Math.ceil(totalRows / perPage) || 1;
    const startIndex = (currentPage - 1) * perPage;
    const paginated = filtered.slice(startIndex, startIndex + perPage);

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder(key === 'name' ? 'asc' : 'desc');
        }
    };

    const getPageNumbers = (current, total) => {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
        if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
        return [1, '...', current - 1, current, current + 1, '...', total];
    };

    const SortIcon = ({ column }) => {
        if (sortKey !== column) return <span className="text-gray-300 ml-1 text-xs">↕</span>;
        return sortOrder === 'asc' ? (
            <ChevronUp className="inline w-3.5 h-3.5 ml-1 text-emerald-700" />
        ) : (
            <ChevronDown className="inline w-3.5 h-3.5 ml-1 text-emerald-700" />
        );
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
            {/* Header Toolbar */}
            <div className="pb-4 mb-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 text-[#004D40] rounded-xl">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900 text-lg">Peringkat Kinerja Perusahaan</h3>
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                                    {totalRows.toLocaleString('id-ID')} Perusahaan
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Perbandingan komprehensif demografi, partisipasi pelatihan, dan risiko pensiun antar entitas perusahaan.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Search */}
                    <div className="relative flex-1 sm:flex-initial sm:w-64">
                        <input
                            type="text"
                            placeholder="Cari nama perusahaan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white shadow-2xs transition-all"
                        />
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
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
                            onChange={(e) => setPerPage(Number(e.target.value))}
                            className="border border-gray-200 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs bg-white shadow-2xs cursor-pointer font-medium text-gray-700"
                        >
                            <option value={10}>10 baris</option>
                            <option value={25}>25 baris</option>
                            <option value={50}>50 baris</option>
                            <option value={100}>100 baris</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto relative">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs text-gray-500 uppercase bg-slate-50/95 backdrop-blur-xs border-b border-gray-200/80 sticky top-0 z-10 shadow-2xs">
                        <tr>
                            <th 
                                className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center gap-1">
                                    <span>Perusahaan</span>
                                    <SortIcon column="name" />
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right"
                                onClick={() => handleSort('hc')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>Total HC</span>
                                    <SortIcon column="hc" />
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right"
                                onClick={() => handleSort('avg_age')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>Rata Umur</span>
                                    <SortIcon column="avg_age" />
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right"
                                onClick={() => handleSort('trained_hc')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>Karyawan Dilatih</span>
                                    <SortIcon column="trained_hc" />
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right"
                                onClick={() => handleSort('coverage')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>Coverage (%)</span>
                                    <SortIcon column="coverage" />
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right"
                                onClick={() => handleSort('total_hours')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>Total Jam</span>
                                    <SortIcon column="total_hours" />
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right"
                                onClick={() => handleSort('avg_hours')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>Jam/Org</span>
                                    <SortIcon column="avg_hours" />
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right"
                                onClick={() => handleSort('risk_pct')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>Risiko Pensiun (%)</span>
                                    <SortIcon column="risk_pct" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {paginated.length > 0 ? (
                            paginated.map((row) => {
                                const selected = isSelectedCompany ? isSelectedCompany(row) : false;
                                return (
                                    <tr 
                                        key={row.id || row.name} 
                                        className={`transition-colors group ${
                                            selected ? 'bg-emerald-50/70 font-semibold' : 'hover:bg-emerald-50/30'
                                        }`}
                                    >
                                        <td className="px-4 py-3.5 font-medium text-gray-900">
                                            <button
                                                type="button"
                                                onClick={() => onSelectCompany && onSelectCompany(row)}
                                                className="text-left hover:text-emerald-700 transition-colors font-medium cursor-pointer inline-flex items-center gap-1.5"
                                                title="Klik untuk memfilter dashboard berdasarkan perusahaan ini"
                                            >
                                                <span>{row.name}</span>
                                                {selected && (
                                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                                                        Terpilih
                                                    </span>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                                            {formatNumber(row.hc)} <span className="text-xs font-normal text-gray-500">orang</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-600 whitespace-nowrap">
                                            {formatDecimal(row.avg_age)} thn
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-medium text-emerald-800 whitespace-nowrap">
                                            {formatNumber(row.trained_hc ?? 0)}
                                        </td>
                                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                                                row.coverage >= 70 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' :
                                                row.coverage >= 30 ? 'bg-blue-50 text-blue-800 border border-blue-200/60' :
                                                row.coverage > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200/60' :
                                                'bg-gray-100 text-gray-500'
                                            }`}>
                                                {formatDecimal(row.coverage)}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-700 whitespace-nowrap">
                                            {formatNumber(row.total_hours ?? 0)} jam
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-500 whitespace-nowrap">
                                            {formatDecimal(row.avg_hours)} jam/org
                                        </td>
                                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                                                row.risk_pct >= 20 ? 'bg-red-50 text-red-700 border border-red-200/60' :
                                                row.risk_pct >= 10 ? 'bg-amber-50 text-amber-700 border border-amber-200/60' :
                                                'bg-gray-50 text-gray-600'
                                            }`}>
                                                {formatDecimal(row.risk_pct)}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="8" className="px-6 py-16 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="p-3 rounded-full bg-gray-50 text-gray-400">
                                            <Building2 size={24} />
                                        </div>
                                        <p className="text-base font-semibold text-gray-700">Tidak ada perusahaan yang cocok</p>
                                        <p className="text-xs text-gray-400">Silakan sesuaikan kata kunci pencarian yang dimasukkan.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {totalRows > 0 && (
                <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
                    <div className="text-xs sm:text-sm text-gray-500">
                        Menampilkan <span className="font-semibold text-gray-900">{startIndex + 1}</span> - <span className="font-semibold text-gray-900">{Math.min(startIndex + perPage, totalRows)}</span> dari <span className="font-semibold text-gray-900">{totalRows.toLocaleString('id-ID')}</span> perusahaan
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center flex-wrap justify-center sm:justify-end gap-1">
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className="min-w-[2rem] h-8 px-2 flex items-center justify-center rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-900 cursor-pointer"
                                aria-label="Sebelumnya"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {getPageNumbers(currentPage, totalPages).map((item, idx) => (
                                item === '...' ? (
                                    <span key={`ellipsis-${idx}`} className="min-w-[2rem] h-8 px-2 flex items-center justify-center text-xs text-gray-300">
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setCurrentPage(item)}
                                        className={`min-w-[2rem] h-8 px-2.5 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                            currentPage === item
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
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                className="min-w-[2rem] h-8 px-2 flex items-center justify-center rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-900 cursor-pointer"
                                aria-label="Selanjutnya"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function JobTitlesTable({ data = [], onSelectJobTitle, onSelectLevel }) {
    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('all');
    const [sortKey, setSortKey] = useState('hc');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Extract unique levels for filter dropdown
    const availableLevels = useMemo(() => {
        const set = new Set();
        data.forEach(item => {
            if (item.level && item.level !== '-') set.add(String(item.level));
        });
        return Array.from(set).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
    }, [data]);

    // Filter and sort data
    const filtered = useMemo(() => {
        let result = data;

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(item => 
                (item.title && String(item.title).toLowerCase().includes(q)) || 
                (item.level && String(item.level).toLowerCase().includes(q))
            );
        }

        if (levelFilter !== 'all') {
            result = result.filter(item => String(item.level) === String(levelFilter));
        }

        return [...result].sort((a, b) => {
            let valA = a[sortKey];
            let valB = b[sortKey];

            if (valA === undefined || valA === null) valA = '';
            if (valB === undefined || valB === null) valB = '';

            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortOrder === 'asc' ? valA - valB : valB - valA;
            }

            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();

            const cmp = strA.localeCompare(strB, undefined, { numeric: true });
            return sortOrder === 'asc' ? cmp : -cmp;
        });
    }, [data, search, levelFilter, sortKey, sortOrder]);

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, levelFilter, perPage]);

    const totalRows = filtered.length;
    const totalPages = Math.ceil(totalRows / perPage) || 1;
    const startIndex = (currentPage - 1) * perPage;
    const paginated = filtered.slice(startIndex, startIndex + perPage);

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder(key === 'title' || key === 'level' ? 'asc' : 'desc');
        }
    };

    const getPageNumbers = (current, total) => {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
        if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
        return [1, '...', current - 1, current, current + 1, '...', total];
    };

    const SortIcon = ({ column }) => {
        if (sortKey !== column) return <span className="text-gray-300 ml-1 text-xs">↕</span>;
        return sortOrder === 'asc' ? (
            <ChevronUp className="inline w-3.5 h-3.5 ml-1 text-emerald-700" />
        ) : (
            <ChevronDown className="inline w-3.5 h-3.5 ml-1 text-emerald-700" />
        );
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
            {/* Header Toolbar */}
            <div className="pb-4 mb-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 text-[#004D40] rounded-xl">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900 text-lg">Daftar Seluruh Jabatan &amp; Headcount</h3>
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                                    {totalRows.toLocaleString('id-ID')} Jabatan
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Rekapitulasi lengkap jumlah karyawan dan keterlibatan pelatihan pada masing-masing jabatan.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Search */}
                    <div className="relative flex-1 sm:flex-initial sm:w-64">
                        <input
                            type="text"
                            placeholder="Cari nama jabatan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white shadow-2xs transition-all"
                        />
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                title="Hapus pencarian"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Filter Level */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 shrink-0">
                        <span className="text-xs font-medium text-gray-500">Level:</span>
                        <select
                            value={levelFilter}
                            onChange={(e) => setLevelFilter(e.target.value)}
                            className="border border-gray-200 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs bg-white shadow-2xs cursor-pointer font-medium text-gray-700"
                        >
                            <option value="all">Semua Level ({availableLevels.length})</option>
                            {availableLevels.map(lvl => (
                                <option key={lvl} value={lvl}>Level {lvl}</option>
                            ))}
                        </select>
                    </div>

                    {/* Per-Page Selector */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 shrink-0">
                        <span className="text-xs font-medium text-gray-500">Tampilkan:</span>
                        <select
                            value={perPage}
                            onChange={(e) => setPerPage(Number(e.target.value))}
                            className="border border-gray-200 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs bg-white shadow-2xs cursor-pointer font-medium text-gray-700"
                        >
                            <option value={10}>10 baris</option>
                            <option value={25}>25 baris</option>
                            <option value={50}>50 baris</option>
                            <option value={100}>100 baris</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto relative">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs text-gray-500 uppercase bg-slate-50/95 backdrop-blur-xs border-b border-gray-200/80 sticky top-0 z-10 shadow-2xs">
                        <tr>
                            <th 
                                className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap"
                                onClick={() => handleSort('title')}
                            >
                                <div className="flex items-center gap-1">
                                    <span>Nama Jabatan</span>
                                    <SortIcon column="title" />
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-center"
                                onClick={() => handleSort('level')}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    <span>Level</span>
                                    <SortIcon column="level" />
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right"
                                onClick={() => handleSort('hc')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>Jumlah Karyawan (HC)</span>
                                    <SortIcon column="hc" />
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right"
                                onClick={() => handleSort('pct_of_total')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>Porsi (%)</span>
                                    <SortIcon column="pct_of_total" />
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right"
                                onClick={() => handleSort('trained_hc')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>Karyawan Dilatih</span>
                                    <SortIcon column="trained_hc" />
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right"
                                onClick={() => handleSort('coverage')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>Coverage (%)</span>
                                    <SortIcon column="coverage" />
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right"
                                onClick={() => handleSort('total_hours')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>Total Jam</span>
                                    <SortIcon column="total_hours" />
                                </div>
                            </th>
                            <th 
                                className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right"
                                onClick={() => handleSort('avg_hours')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    <span>Rata Jam</span>
                                    <SortIcon column="avg_hours" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {paginated.length > 0 ? (
                            paginated.map((row) => (
                                <tr key={`${row.title}-${row.level}`} className="hover:bg-emerald-50/30 transition-colors group">
                                    <td className="px-4 py-3.5 font-medium text-gray-900">
                                        <button
                                            type="button"
                                            onClick={() => onSelectJobTitle && onSelectJobTitle(row.title)}
                                            className="text-left hover:text-emerald-700 transition-colors font-medium cursor-pointer"
                                            title="Klik untuk memfilter berdasarkan jabatan ini"
                                        >
                                            {row.title}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                        <button
                                            type="button"
                                            onClick={() => onSelectLevel && onSelectLevel(row.level)}
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 hover:bg-emerald-100 hover:text-emerald-900 transition-colors cursor-pointer"
                                            title={`Level ${row.level} (Klik untuk filter)`}
                                        >
                                            Level {row.level}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                                        {formatNumber(row.hc)} <span className="text-xs font-normal text-gray-500">orang</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-600 whitespace-nowrap">
                                        {formatDecimal(row.pct_of_total)}%
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-medium text-emerald-800 whitespace-nowrap">
                                        {formatNumber(row.trained_hc)}
                                    </td>
                                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                                            row.coverage >= 70 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' :
                                            row.coverage >= 30 ? 'bg-blue-50 text-blue-800 border border-blue-200/60' :
                                            row.coverage > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200/60' :
                                            'bg-gray-100 text-gray-500'
                                        }`}>
                                            {formatDecimal(row.coverage)}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-700 whitespace-nowrap">
                                        {formatNumber(row.total_hours)} jam
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-500 whitespace-nowrap">
                                        {formatDecimal(row.avg_hours)} jam/org
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="px-6 py-16 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="p-3 rounded-full bg-gray-50 text-gray-400">
                                            <Briefcase size={24} />
                                        </div>
                                        <p className="text-base font-semibold text-gray-700">Tidak ada jabatan yang cocok</p>
                                        <p className="text-xs text-gray-400">Silakan sesuaikan kata kunci pencarian atau filter level yang dipilih.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {totalRows > 0 && (
                <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
                    <div className="text-xs sm:text-sm text-gray-500">
                        Menampilkan <span className="font-semibold text-gray-900">{startIndex + 1}</span> - <span className="font-semibold text-gray-900">{Math.min(startIndex + perPage, totalRows)}</span> dari <span className="font-semibold text-gray-900">{totalRows.toLocaleString('id-ID')}</span> jabatan
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center flex-wrap justify-center sm:justify-end gap-1">
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className="min-w-[2rem] h-8 px-2 flex items-center justify-center rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-900 cursor-pointer"
                                aria-label="Sebelumnya"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {getPageNumbers(currentPage, totalPages).map((item, idx) => (
                                item === '...' ? (
                                    <span key={`ellipsis-${idx}`} className="min-w-[2rem] h-8 px-2 flex items-center justify-center text-xs text-gray-300">
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setCurrentPage(item)}
                                        className={`min-w-[2rem] h-8 px-2.5 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                            currentPage === item
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
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                className="min-w-[2rem] h-8 px-2 flex items-center justify-center rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-900 cursor-pointer"
                                aria-label="Selanjutnya"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
