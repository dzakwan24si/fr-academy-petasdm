import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import FilterBar from '@/Components/ui/FilterBar';
import { Search, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, AlertCircle, X, BarChart2 } from 'lucide-react';
import { StaffDetailModal } from '@/Components/staff/StaffDetailModal';

export default function TrainingData({ records, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            '/pelatihan/data',
            { ...filters, search: searchTerm, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSort = (column) => {
        const currentSort = filters.sort || 'participant_name';
        const currentOrder = filters.order || 'asc';
        
        let newOrder = 'asc';
        if (currentSort === column) {
            newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
        }

        router.get(
            '/pelatihan/data',
            { ...filters, sort: column, order: newOrder, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handlePerPageChange = (e) => {
        router.get(
            '/pelatihan/data',
            { ...filters, per_page: e.target.value, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const SortIcon = ({ column }) => {
        const currentSort = filters.sort || 'participant_name';
        const currentOrder = filters.order || 'asc';
        
        if (currentSort !== column) {
            return <span className="text-gray-300 ml-1">↕</span>;
        }
        
        return currentOrder === 'asc' ? 
            <ChevronUp className="inline w-4 h-4 ml-1 text-emerald-700" /> : 
            <ChevronDown className="inline w-4 h-4 ml-1 text-emerald-700" />;
    };

    const renderNikBadge = (status) => {
        if (status === 'ok') return <span className="inline-flex items-center bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200/60 ml-2">OK</span>;
        if (status === 'empty') return <span className="inline-flex items-center bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200 ml-2">KOSONG</span>;
        if (status === 'corrupt') return <span className="inline-flex items-center bg-rose-50 text-rose-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-rose-200/60 ml-2">RUSAK</span>;
        return <span className="inline-flex items-center bg-amber-50 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-200/60 ml-2">TIDAK VALID</span>;
    };

    const renderConnectionBadge = (isLinked) => {
        if (isLinked) {
            return <span className="inline-flex items-center bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200/60 whitespace-nowrap">TERHUBUNG KE KARYAWAN</span>;
        }
        return <span className="inline-flex items-center bg-slate-100 text-slate-500 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-slate-200 whitespace-nowrap">TIDAK TERHUBUNG</span>;
    };

    return (
        <AppLayout title="Data Training Mentah">
            <Head title="Data Training Mentah" />

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Data Training Mentah</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Daftar lengkap rekam data pelatihan ({records.total?.toLocaleString('id-ID')} baris).
                    </p>
                </div>
                
                <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                    <Link
                        href="/pelatihan"
                        className="inline-flex items-center px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs"
                    >
                        <BarChart2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                        Dashboard Analitik
                    </Link>
                    <a 
                        href={`/pelatihan/data/export?${new URLSearchParams(filters).toString()}`}
                        className="inline-flex items-center px-4 py-2 bg-[#004D40] text-white rounded-xl hover:bg-[#00382e] transition-colors font-medium text-sm shadow-xs border border-emerald-900/10 shrink-0"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export Excel
                    </a>
                </div>
            </div>

            <FilterBar />

            <div className="mt-6 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60">
                    <form onSubmit={handleSearch} className="flex relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder="Cari peserta, NIK, pelatihan, PT..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm bg-white shadow-2xs transition-all"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchTerm('');
                                    router.get('/pelatihan/data', { ...filters, search: '', page: 1 }, { preserveState: true, preserveScroll: true });
                                }}
                                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                                title="Hapus pencarian"
                            >
                                <X size={14} />
                            </button>
                        )}
                        <button type="submit" className="hidden">Search</button>
                    </form>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 shrink-0">
                        <span className="text-xs font-medium text-gray-500">Tampilkan:</span>
                        <select 
                            value={filters.per_page || 25} 
                            onChange={handlePerPageChange}
                            className="border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm bg-white shadow-2xs cursor-pointer"
                        >
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-270px)] relative">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-xs text-gray-500 uppercase bg-slate-50/95 backdrop-blur-xs border-b border-gray-200/80 sticky top-0 z-10 shadow-2xs">
                            <tr>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('nik')}>
                                    NIK / NIK Mentah <SortIcon column="nik" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('participant_name')}>
                                    Nama Peserta <SortIcon column="participant_name" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold whitespace-nowrap text-center">Status Terhubung</th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('training_name')}>
                                    Nama Pelatihan <SortIcon column="training_name" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('pt_name')}>
                                    Nama PT <SortIcon column="pt_name" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('department')}>
                                    Departemen <SortIcon column="department" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('work_location')}>
                                    Lokasi Kerja <SortIcon column="work_location" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('region')}>
                                    Region <SortIcon column="region" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('job_category')}>
                                    Golongan <SortIcon column="job_category" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('period_year')}>
                                    Periode <SortIcon column="period_year" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right" onClick={() => handleSort('hours')}>
                                    Jam <SortIcon column="hours" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('is_internal')}>
                                    Tipe <SortIcon column="is_internal" />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {records.data.length > 0 ? (
                                records.data.map((rec) => (
                                    <tr key={rec.id} className="hover:bg-emerald-50/30 transition-colors group">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100/70 px-2 py-0.5 rounded border border-gray-200/50">
                                                {rec.nik || '-'}
                                            </span>
                                            {renderNikBadge(rec.nik_status)}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                                            {rec.employee ? (
                                                <button 
                                                    onClick={() => setSelectedEmployee(rec.employee)}
                                                    className="text-emerald-700 hover:text-emerald-800 hover:underline text-left transition-colors font-semibold"
                                                    title="Klik untuk melihat detail profil karyawan"
                                                >
                                                    {rec.participant_name}
                                                </button>
                                            ) : (
                                                <span title="Tidak dapat dihubungkan ke data karyawan" className="text-gray-900">
                                                    {rec.participant_name}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {renderConnectionBadge(!!rec.employee_id)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-800 font-medium max-w-[220px] truncate" title={rec.training_name}>
                                            {rec.training_name}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-gray-900 font-medium">{rec.pt_name}</div>
                                            {rec.company_alias !== '-' && <div className="text-[10px] text-gray-400">Alias: {rec.company_alias}</div>}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">{rec.department || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">{rec.work_location || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">{rec.region || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">{rec.job_category || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">{rec.period_month}/{rec.period_year}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-gray-900">{rec.hours}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-600 font-medium">{rec.is_internal ? 'Internal' : 'Eksternal'}</span>
                                                <span className="text-gray-400">{rec.is_regular ? 'Reguler' : 'Non Reguler'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="12" className="px-4 py-16 text-center text-gray-500">
                                        <p className="text-base font-medium text-gray-700">Tidak ada data training yang ditemukan</p>
                                        <p className="text-xs text-gray-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter yang aktif.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
                    <div className="text-sm text-gray-500">
                        Menampilkan <span className="font-semibold text-gray-900">{records.from || 0}</span> - <span className="font-semibold text-gray-900">{records.to || 0}</span> dari <span className="font-semibold text-gray-900">{records.total?.toLocaleString('id-ID')}</span> data
                    </div>
                    <div className="flex items-center gap-1">
                        {records.links.map((link, i) => {
                            const isPrev = String(link.label).toLowerCase().includes('previous');
                            const isNext = String(link.label).toLowerCase().includes('next');
                            let label = isPrev ? <ChevronLeft className="w-4 h-4" /> : isNext ? <ChevronRight className="w-4 h-4" /> : <span dangerouslySetInnerHTML={{ __html: link.label }}></span>;
                            
                            return link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`
                                        flex items-center justify-center min-w-[2rem] h-8 px-2.5 text-sm rounded-lg transition-colors
                                        ${link.active 
                                            ? 'bg-[#004D40] text-white shadow-2xs font-semibold' 
                                            : 'text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-900'}
                                    `}
                                    preserveState
                                    preserveScroll
                                >
                                    {label}
                                </Link>
                            ) : (
                                <span key={i} className="flex items-center justify-center min-w-[2rem] h-8 px-2.5 text-sm text-gray-300">
                                    {label}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {selectedEmployee && (
                <StaffDetailModal 
                    employeeId={selectedEmployee.employee_id} 
                    onClose={() => setSelectedEmployee(null)} 
                />
            )}
        </AppLayout>
    );
}
