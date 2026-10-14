import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import FilterBar from '@/Components/ui/FilterBar';
import { Search, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { StaffDetailModal } from '@/Components/staff/StaffDetailModal';
import { formatDecimal } from '@/lib/format';
import EmployeeAvatar from '@/Components/EmployeeAvatar';


export default function EmployeeIndex({ employees, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            '/karyawan',
            { ...filters, search: searchTerm, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSort = (column) => {
        const currentSort = filters.sort || 'name';
        const currentOrder = filters.order || 'asc';
        
        let newOrder = 'asc';
        if (currentSort === column) {
            newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
        }

        router.get(
            '/karyawan',
            { ...filters, sort: column, order: newOrder, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handlePerPageChange = (e) => {
        router.get(
            '/karyawan',
            { ...filters, per_page: e.target.value, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const renderEmploymentBadge = (type) => {
        const normalized = (type || '').toUpperCase();
        if (normalized === 'PERMANENT' || normalized === 'PERM') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    Permanent
                </span>
            );
        }
        if (normalized === 'CONTRACT' || normalized === 'PKWT') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                    Contract
                </span>
            );
        }
        if (normalized === 'PROBATION') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200/60">
                    Probation
                </span>
            );
        }
        if (normalized === 'TRAINEE') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200/60">
                    Trainee
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                {type || '-'}
            </span>
        );
    };

    const SortIcon = ({ column }) => {
        const currentSort = filters.sort || 'name';
        const currentOrder = filters.order || 'asc';
        
        if (currentSort !== column) {
            return <span className="text-gray-300 ml-1">↕</span>;
        }
        
        return currentOrder === 'asc' ? 
            <ChevronUp className="inline w-4 h-4 ml-1 text-emerald-700" /> : 
            <ChevronDown className="inline w-4 h-4 ml-1 text-emerald-700" />;
    };

    return (
        <AppLayout title="Direktori Karyawan">
            <Head title="Direktori Karyawan" />

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Direktori Karyawan</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Daftar lengkap data karyawan perusahaan ({employees.total?.toLocaleString('id-ID')} total).
                    </p>
                </div>
                
                <a 
                    href={`/karyawan/export?${new URLSearchParams(filters).toString()}`}
                    className="inline-flex items-center px-4 py-2 bg-[#004D40] text-white rounded-xl hover:bg-[#00382e] transition-colors font-medium text-sm shadow-xs border border-emerald-900/10 shrink-0 self-start sm:self-auto"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export Excel
                </a>
            </div>

            <FilterBar />

            <div className="mt-6 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60">
                    <form onSubmit={handleSearch} className="flex relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder="Cari nama, NIK, atau jabatan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm bg-white shadow-2xs transition-all"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
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
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('employee_id')}>
                                    NIK <SortIcon column="employee_id" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('name')}>
                                    Nama Karyawan <SortIcon column="name" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('company_name')}>
                                    Perusahaan <SortIcon column="company_name" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('location_name')}>
                                    Lokasi <SortIcon column="location_name" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('organization_name')}>
                                    Departemen <SortIcon column="organization_name" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('job_title_name')}>
                                    Jabatan <SortIcon column="job_title_name" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-center" onClick={() => handleSort('job_level_code')}>
                                    Level <SortIcon column="job_level_code" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-center" onClick={() => handleSort('generasi')}>
                                    Generasi <SortIcon column="generasi" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right" onClick={() => handleSort('umur')}>
                                    Umur <SortIcon column="umur" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right" onClick={() => handleSort('masa_kerja')}>
                                    Masa Kerja <SortIcon column="masa_kerja" />
                                </th>
                                <th className="px-4 py-3.5 font-semibold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-center" onClick={() => handleSort('employment_type')}>
                                    Status <SortIcon column="employment_type" />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {employees.data.length > 0 ? (
                                employees.data.map((emp) => (
                                    <tr 
                                        key={emp.id} 
                                        onClick={() => setSelectedEmployeeId(emp.employee_id)}
                                        className="hover:bg-emerald-50/30 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700 whitespace-nowrap">
                                            <span className="bg-gray-100/70 text-gray-700 px-2 py-0.5 rounded border border-gray-200/50">
                                                {emp.employee_id}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center space-x-3">
                                                <EmployeeAvatar name={emp.name} photoUrl={emp.photo_url} size="sm" />
                                                <span className="font-semibold text-gray-900 group-hover:text-emerald-800 transition-colors">{emp.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">{emp.company_name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">{emp.location_name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">{emp.department}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-medium">{emp.job_title}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-slate-200/60">
                                                {emp.level}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center text-xs font-medium text-gray-600">
                                            {emp.generasi}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700 font-medium">{formatDecimal(emp.umur)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700 font-medium">{formatDecimal(emp.masa_kerja)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            {renderEmploymentBadge(emp.employment_type)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="11" className="px-4 py-16 text-center text-gray-500">
                                        <p className="text-base font-medium text-gray-700">Tidak ada data karyawan yang ditemukan</p>
                                        <p className="text-xs text-gray-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter yang aktif.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {employees.total > 0 && (
                    <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
                        <div className="text-sm text-gray-500">
                            Menampilkan <span className="font-semibold text-gray-900">{employees.from}</span> - <span className="font-semibold text-gray-900">{employees.to}</span> dari <span className="font-semibold text-gray-900">{employees.total?.toLocaleString('id-ID')}</span> karyawan
                        </div>
                        <div className="flex items-center gap-1">
                            {employees.links.map((link, i) => {
                                let label = link.label;
                                if (String(link.label).toLowerCase().includes('previous')) {
                                    label = <ChevronLeft className="w-4 h-4" />;
                                } else if (String(link.label).toLowerCase().includes('next')) {
                                    label = <ChevronRight className="w-4 h-4" />;
                                }
                                
                                return link.url ? (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        preserveScroll
                                        preserveState
                                        className={`min-w-[2rem] h-8 px-2.5 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                            link.active 
                                                ? 'bg-[#004D40] text-white shadow-2xs font-semibold' 
                                                : 'text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-900'
                                        }`}
                                    >
                                        {label}
                                    </Link>
                                ) : (
                                    <span key={i} className="min-w-[2rem] h-8 px-2.5 flex items-center justify-center text-sm font-medium text-gray-300">
                                        {label}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {selectedEmployeeId && (
                <StaffDetailModal 
                    employeeId={selectedEmployeeId} 
                    onClose={() => setSelectedEmployeeId(null)} 
                />
            )}
        </AppLayout>
    );
}
