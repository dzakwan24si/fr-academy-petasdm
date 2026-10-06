import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import FilterBar from '@/Components/ui/FilterBar';
import { Search, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { StaffDetailModal } from '@/Components/Map/StaffDetailModal';
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

    const SortIcon = ({ column }) => {
        const currentSort = filters.sort || 'name';
        const currentOrder = filters.order || 'asc';
        
        if (currentSort !== column) {
            return <span className="text-gray-300 ml-1">↕</span>;
        }
        
        return currentOrder === 'asc' ? 
            <ChevronUp className="inline w-4 h-4 ml-1 text-blue-600" /> : 
            <ChevronDown className="inline w-4 h-4 ml-1 text-blue-600" />;
    };

    return (
        <AppLayout title="Direktori Karyawan">
            <Head title="Direktori Karyawan" />

            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Direktori Karyawan</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Daftar lengkap data karyawan perusahaan ({employees.total} total).
                    </p>
                </div>
                
                <a 
                    href={`/karyawan/export?${new URLSearchParams(filters).toString()}`}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm shadow-sm"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export Excel
                </a>
            </div>

            <FilterBar />

            <div className="mt-6 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <form onSubmit={handleSearch} className="flex relative w-72">
                        <input
                            type="text"
                            placeholder="Cari nama, NIK, atau jabatan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <button type="submit" className="hidden">Search</button>
                    </form>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Tampilkan:</span>
                        <select 
                            value={filters.per_page || 25} 
                            onChange={handlePerPageChange}
                            className="border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm bg-white"
                        >
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition whitespace-nowrap" onClick={() => handleSort('employee_id')}>
                                    NIK <SortIcon column="employee_id" />
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition whitespace-nowrap" onClick={() => handleSort('name')}>
                                    Nama Karyawan <SortIcon column="name" />
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition whitespace-nowrap" onClick={() => handleSort('company_name')}>
                                    Perusahaan <SortIcon column="company_name" />
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition whitespace-nowrap" onClick={() => handleSort('location_name')}>
                                    Lokasi <SortIcon column="location_name" />
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition whitespace-nowrap" onClick={() => handleSort('organization_name')}>
                                    Departemen <SortIcon column="organization_name" />
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition whitespace-nowrap" onClick={() => handleSort('job_title_name')}>
                                    Jabatan <SortIcon column="job_title_name" />
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition whitespace-nowrap" onClick={() => handleSort('job_level_code')}>
                                    Level <SortIcon column="job_level_code" />
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition whitespace-nowrap" onClick={() => handleSort('generasi')}>
                                    Generasi <SortIcon column="generasi" />
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition whitespace-nowrap text-right" onClick={() => handleSort('umur')}>
                                    Umur <SortIcon column="umur" />
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition whitespace-nowrap text-right" onClick={() => handleSort('masa_kerja')}>
                                    Masa Kerja <SortIcon column="masa_kerja" />
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition whitespace-nowrap" onClick={() => handleSort('employment_type')}>
                                    Status <SortIcon column="employment_type" />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {employees.data.length > 0 ? (
                                employees.data.map((emp) => (
                                    <tr 
                                        key={emp.id} 
                                        onClick={() => setSelectedEmployeeId(emp.employee_id)}
                                        className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{emp.employee_id}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center space-x-3">
                                                <EmployeeAvatar name={emp.name} photoUrl={emp.photo_url} size="sm" />
                                                <span className="font-semibold text-gray-900">{emp.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">{emp.company_name}</td>

                                        <td className="px-4 py-3 whitespace-nowrap">{emp.location_name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{emp.department}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{emp.job_title}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">{emp.level}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">{emp.generasi}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">{formatDecimal(emp.umur)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">{formatDecimal(emp.masa_kerja)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <span className={`text-xs font-semibold px-3 py-1 rounded-full text-white ${emp.employment_type === 'Permanent' ? 'bg-green-600' : 'bg-amber-500'}`}>
                                                {emp.employment_type}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="11" className="px-4 py-12 text-center text-gray-500">
                                        Tidak ada data karyawan yang ditemukan dengan filter saat ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {employees.total > 0 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white">
                        <div className="text-sm text-gray-500">
                            Menampilkan <span className="font-medium text-gray-900">{employees.from}</span> - <span className="font-medium text-gray-900">{employees.to}</span> dari <span className="font-medium text-gray-900">{employees.total}</span> karyawan
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
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                            link.active 
                                                ? 'bg-blue-600 text-white' 
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        {label}
                                    </Link>
                                ) : (
                                    <span key={i} className="px-3 py-1.5 text-sm font-medium text-gray-300">
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
