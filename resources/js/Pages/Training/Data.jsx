import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import FilterBar from '@/Components/ui/FilterBar';
import { Search, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { StaffDetailModal } from '@/Components/Map/StaffDetailModal';

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
            <ChevronUp className="inline w-4 h-4 ml-1 text-blue-600" /> : 
            <ChevronDown className="inline w-4 h-4 ml-1 text-blue-600" />;
    };

    const renderNikBadge = (status) => {
        if (status === 'ok') return <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">OK</span>;
        if (status === 'empty') return <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">KOSONG</span>;
        if (status === 'corrupt') return <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">RUSAK</span>;
        return <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">TIDAK VALID</span>;
    };

    const renderConnectionBadge = (isLinked) => {
        if (isLinked) {
            return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap">TERHUBUNG KE KARYAWAN</span>;
        }
        return <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap">TIDAK TERHUBUNG</span>;
    };

    return (
        <AppLayout title="Data Training Mentah">
            <Head title="Data Training Mentah" />

            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Data Training Mentah</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Daftar lengkap rekam data pelatihan ({records.total} baris).
                    </p>
                </div>
                
                <a 
                    href={`/pelatihan/data/export?${new URLSearchParams(filters).toString()}`}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm shadow-sm"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export Excel
                </a>
            </div>

            <FilterBar />

            <div className="mt-6 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <form onSubmit={handleSearch} className="flex relative w-80">
                        <input
                            type="text"
                            placeholder="Cari peserta, NIK, pelatihan, PT..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <button type="submit" className="hidden">Search</button>
                    </form>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Tampilkan:</span>
                        <select 
                            value={filters.per_page || 25} 
                            onChange={handlePerPageChange}
                            className="border-gray-200 rounded text-sm py-1 pl-2 pr-6 focus:ring-amber-500 focus:border-amber-500"
                        >
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => handleSort('nik')}>
                                    NIK / NIK Mentah <SortIcon column="nik" />
                                </th>
                                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => handleSort('participant_name')}>
                                    Nama Peserta <SortIcon column="participant_name" />
                                </th>
                                <th className="px-4 py-3 font-semibold whitespace-nowrap text-center">Status Terhubung</th>
                                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => handleSort('training_name')}>
                                    Nama Pelatihan <SortIcon column="training_name" />
                                </th>
                                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => handleSort('pt_name')}>
                                    Nama PT <SortIcon column="pt_name" />
                                </th>
                                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => handleSort('department')}>
                                    Departemen <SortIcon column="department" />
                                </th>
                                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => handleSort('work_location')}>
                                    Lokasi Kerja <SortIcon column="work_location" />
                                </th>
                                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => handleSort('region')}>
                                    Region <SortIcon column="region" />
                                </th>
                                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => handleSort('job_category')}>
                                    Golongan <SortIcon column="job_category" />
                                </th>
                                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => handleSort('period_year')}>
                                    Periode <SortIcon column="period_year" />
                                </th>
                                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 whitespace-nowrap text-right" onClick={() => handleSort('hours')}>
                                    Jam <SortIcon column="hours" />
                                </th>
                                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => handleSort('is_internal')}>
                                    Tipe <SortIcon column="is_internal" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.data.length > 0 ? (
                                records.data.map((rec) => (
                                    <tr key={rec.id} className="bg-white border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="font-medium text-gray-900">{rec.nik || '-'}</span>
                                            {renderNikBadge(rec.nik_status)}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                                            {rec.employee ? (
                                                <button 
                                                    onClick={() => setSelectedEmployee(rec.employee)}
                                                    className="text-amber-600 hover:text-amber-700 hover:underline text-left transition-colors"
                                                    title="Klik untuk melihat detail profil karyawan"
                                                >
                                                    {rec.participant_name}
                                                </button>
                                            ) : (
                                                <span title="Tidak dapat dihubungkan ke data karyawan" className="text-gray-900 cursor-not-allowed">
                                                    {rec.participant_name}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {renderConnectionBadge(!!rec.employee_id)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-800 font-medium max-w-[200px] truncate" title={rec.training_name}>
                                            {rec.training_name}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-gray-900 font-medium">{rec.pt_name}</div>
                                            {rec.company_alias !== '-' && <div className="text-[10px] text-gray-400">Alias: {rec.company_alias}</div>}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">{rec.department || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{rec.work_location || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{rec.region || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{rec.job_category || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{rec.period_month}/{rec.period_year}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right font-semibold">{rec.hours}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500">{rec.is_internal ? 'Internal' : 'Eksternal'}</span>
                                                <span className="text-gray-400">{rec.is_regular ? 'Reguler' : 'Non Reguler'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="12" className="px-4 py-8 text-center text-gray-500">
                                        Tidak ada data training yang ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white">
                    <div className="text-sm text-gray-500">
                        Menampilkan <span className="font-medium text-gray-900">{records.from || 0}</span> - <span className="font-medium text-gray-900">{records.to || 0}</span> dari <span className="font-medium text-gray-900">{records.total}</span> data
                    </div>
                    <div className="flex items-center gap-1">
                        {records.links.map((link, i) => {
                            const isPrev = link.label.includes('Previous');
                            const isNext = link.label.includes('Next');
                            
                            return (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`
                                        flex items-center justify-center min-w-[2rem] h-8 px-3 text-sm rounded-md transition-colors
                                        ${!link.url ? 'text-gray-300 cursor-not-allowed' : 
                                          link.active ? 'bg-amber-50 text-amber-600 font-bold' : 
                                          'text-gray-600 hover:bg-gray-100'}
                                    `}
                                    preserveState
                                    preserveScroll
                                >
                                    {isPrev ? <ChevronLeft className="w-4 h-4" /> : isNext ? <ChevronRight className="w-4 h-4" /> : <span dangerouslySetInnerHTML={{ __html: link.label }}></span>}
                                </Link>
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
