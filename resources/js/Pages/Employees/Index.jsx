import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import FilterBar from '@/Components/ui/FilterBar';
import { 
    Search, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
    Columns, Table as TableIcon, Users, MapPin, Briefcase, Sparkles, Eye, X
} from 'lucide-react';
import StaffDetailPane from '@/Components/staff/StaffDetailPane';
import { formatDecimal } from '@/lib/format';
import EmployeeAvatar from '@/Components/EmployeeAvatar';

export default function EmployeeIndex({ employees, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(filters.selected || null);

    const rightPaneRef = useRef(null);
    const [rightHeight, setRightHeight] = useState(null);

    // Sync left pane height with right pane height accurately
    useEffect(() => {
        if (!selectedEmployeeId) {
            setRightHeight(null);
            return;
        }

        const updateHeight = () => {
            if (typeof window !== 'undefined' && window.innerWidth >= 1024 && rightPaneRef.current) {
                const h = Math.round(rightPaneRef.current.getBoundingClientRect().height);
                if (h > 100) {
                    setRightHeight(h);
                }
            } else {
                setRightHeight(null);
            }
        };

        updateHeight();

        let animId = null;
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(animId);
            animId = requestAnimationFrame(updateHeight);
        });

        if (rightPaneRef.current) {
            observer.observe(rightPaneRef.current);
        }
        window.addEventListener('resize', updateHeight);

        return () => {
            cancelAnimationFrame(animId);
            observer.disconnect();
            window.removeEventListener('resize', updateHeight);
        };
    }, [selectedEmployeeId]);

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
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                    Permanent
                </span>
            );
        }
        if (normalized === 'CONTRACT' || normalized === 'PKWT') {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70">
                    Contract
                </span>
            );
        }
        if (normalized === 'PROBATION') {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200/70">
                    Probation
                </span>
            );
        }
        if (normalized === 'TRAINEE') {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200/70">
                    Trainee
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
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
            <ChevronUp className="inline w-3.5 h-3.5 ml-1 text-emerald-700" /> : 
            <ChevronDown className="inline w-3.5 h-3.5 ml-1 text-emerald-700" />;
    };

    return (
        <AppLayout title="Direktori Karyawan">
            <Head title="Direktori Karyawan" />

            {/* TOP EXECUTIVE HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Direktori Karyawan
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Daftar dan profil komprehensif tenaga kerja operasional ({employees.total?.toLocaleString('id-ID')} total staf).
                    </p>
                </div>
                
                {/* Right Tools: View Toggle & Export */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* View Mode Toggle / Reset */}
                    {selectedEmployeeId ? (
                        <button
                            type="button"
                            onClick={() => setSelectedEmployeeId(null)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs border border-gray-200 cursor-pointer"
                            title="Tutup Detail dan Kembali ke Tabel Penuh"
                        >
                            <TableIcon size={14} className="text-[#004D40]" />
                            <span>Tabel Penuh</span>
                            <X size={13} className="text-slate-400" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setSelectedEmployeeId(employees.data?.[0]?.employee_id || null)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs border border-gray-200 cursor-pointer"
                            title="Buka Mode Split Master-Detail"
                        >
                            <Columns size={14} className="text-[#004D40]" />
                            <span>Mode Split Detail</span>
                        </button>
                    )}

                    <a 
                        href={`/karyawan/export?${new URLSearchParams(filters).toString()}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#004D40] hover:bg-[#00382e] text-white rounded-lg text-xs font-bold transition-all shadow-xs border border-emerald-900/10 shrink-0 cursor-pointer"
                    >
                        <Download size={14} />
                        <span>Export Excel</span>
                    </a>
                </div>
            </div>

            {/* GLOBAL FILTER BAR */}
            <FilterBar />

            {/* CONDITIONAL RENDER: SPLIT DETAIL vs FULL-WIDTH TABLE */}
            {selectedEmployeeId ? (
                /* MODE 1: MASTER-DETAIL SPLIT VIEW (EQUAL HEIGHT ALIGNED BOTTOM) */
                <div className="mt-6 flex flex-col lg:flex-row gap-5 items-start animate-in fade-in duration-300">
                    {/* LEFT PANE: MASTER LIST OF EMPLOYEES (Height matches Right Pane exactly) */}
                    <div 
                        className="w-full lg:w-[380px] xl:w-[400px] shrink-0 bg-white border border-gray-200/90 rounded-xl shadow-2xs overflow-hidden flex flex-col transition-[height] duration-150"
                        style={rightHeight ? { height: `${rightHeight}px`, maxHeight: `${rightHeight}px` } : undefined}
                    >
                        {/* Search and Header Box */}
                        <div className="p-3.5 border-b border-gray-100 bg-slate-50/70 space-y-2.5 shrink-0">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                    <Users size={14} className="text-[#004D40]" />
                                    <span>Daftar Karyawan</span>
                                </span>
                                <span className="text-[10px] font-mono font-bold bg-emerald-100/70 text-[#004D40] px-2 py-0.5 rounded-md border border-emerald-200/60">
                                    {employees.total?.toLocaleString('id-ID')} Staf
                                </span>
                            </div>

                            <form onSubmit={handleSearch} className="relative">
                                <input
                                    type="text"
                                    placeholder="Cari nama, NIK, jabatan..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-8 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs bg-white shadow-2xs transition-all font-medium"
                                />
                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchTerm('');
                                            router.get('/karyawan', { ...filters, search: '', page: 1 }, { preserveState: true, preserveScroll: true });
                                        }}
                                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                )}
                            </form>
                        </div>

                        {/* Scrollable List of Staff Cards (Fills Remaining Height to Match Right Pane) */}
                        <div className="divide-y divide-gray-100 flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
                            {employees.data.length > 0 ? (
                                employees.data.map((emp) => {
                                    const isSelected = selectedEmployeeId === emp.employee_id;
                                    return (
                                        <div
                                            key={emp.id}
                                            onClick={() => setSelectedEmployeeId(emp.employee_id)}
                                            className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-3 relative group ${
                                                isSelected
                                                    ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-[#004D40]/20 shadow-2xs'
                                                    : 'bg-white border-slate-200/70 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
                                            }`}
                                        >
                                            {/* Active Left Indicator Bar */}
                                            {isSelected && (
                                                <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#004D40] rounded-r" />
                                            )}

                                            {/* Avatar */}
                                            <div className="shrink-0 pl-1">
                                                <EmployeeAvatar name={emp.name} photoUrl={emp.photo_url} size="md" />
                                            </div>

                                            {/* Info Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <p className={`text-xs font-black truncate leading-tight ${
                                                        isSelected ? 'text-[#004D40]' : 'text-slate-900 group-hover:text-[#004D40]'
                                                    }`}>
                                                        {emp.name}
                                                    </p>
                                                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                                        {emp.employee_id}
                                                    </span>
                                                </div>

                                                <p className="text-[11px] text-slate-600 truncate mt-0.5 font-semibold">
                                                    {emp.job_title}
                                                </p>

                                                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                                                    <span className="truncate max-w-[130px] font-medium text-slate-500">
                                                        {emp.location_name || emp.company_name}
                                                    </span>
                                                    <span>·</span>
                                                    <span className="font-bold text-slate-600 px-1 py-0.2 bg-slate-100 rounded">
                                                        {emp.level}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-12 text-center text-slate-400 p-4">
                                    <Users size={30} className="mx-auto mb-2 opacity-50 text-slate-300" />
                                    <p className="text-xs font-bold text-slate-700">Karyawan Tidak Ditemukan</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter aktif.</p>
                                </div>
                            )}
                        </div>

                        {/* Left Pane Pagination Controls (Pinned at bottom) */}
                        {employees.total > 0 && (
                            <div className="p-2.5 border-t border-gray-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500 shrink-0 mt-auto">
                                <span className="text-[11px]">
                                    Hal <b className="text-slate-900">{employees.current_page}</b> dari <b className="text-slate-900">{employees.last_page}</b>
                                </span>
                                <div className="flex items-center gap-1">
                                    {employees.prev_page_url ? (
                                        <Link
                                            href={employees.prev_page_url}
                                            preserveScroll
                                            preserveState
                                            className="p-1 rounded-md bg-white border border-gray-200 text-slate-700 hover:bg-slate-100 shadow-2xs"
                                            title="Halaman Sebelumnya"
                                        >
                                            <ChevronLeft size={13} />
                                        </Link>
                                    ) : (
                                        <span className="p-1 rounded-md text-slate-300 border border-gray-100 bg-gray-50 cursor-not-allowed">
                                            <ChevronLeft size={13} />
                                        </span>
                                    )}

                                    {employees.next_page_url ? (
                                        <Link
                                            href={employees.next_page_url}
                                            preserveScroll
                                            preserveState
                                            className="p-1 rounded-md bg-white border border-gray-200 text-slate-700 hover:bg-slate-100 shadow-2xs"
                                            title="Halaman Berikutnya"
                                        >
                                            <ChevronRight size={13} />
                                        </Link>
                                    ) : (
                                        <span className="p-1 rounded-md text-slate-300 border border-gray-100 bg-gray-50 cursor-not-allowed">
                                            <ChevronRight size={13} />
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT PANE: DETAIL PROFILE (ANIMATED SLIDE-IN) */}
                    <div ref={rightPaneRef} className="flex-1 min-w-0 w-full flex flex-col gap-3.5 animate-in fade-in slide-in-from-right duration-300">
                        {/* Top Action Ribbon for Detail */}
                        <div className="flex items-center justify-between gap-3 bg-white p-2.5 px-4 rounded-xl border border-gray-200/90 shadow-2xs shrink-0">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Menampilkan Profil: <b className="text-slate-900">{employees.data.find(e => e.employee_id === selectedEmployeeId)?.name || selectedEmployeeId}</b></span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedEmployeeId(null)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                                title="Kembali ke Tampilan Tabel Penuh"
                            >
                                <TableIcon size={14} className="text-[#004D40]" />
                                <span>Kembali ke Tabel Penuh</span>
                                <X size={13} className="text-slate-400" />
                            </button>
                        </div>

                        <StaffDetailPane employeeId={selectedEmployeeId} />
                    </div>
                </div>
            ) : (
                /* MODE 2: FULL-WIDTH TABLE VIEW (DEFAULT BEFORE CLICK) */
                <div className="mt-6 bg-white border border-gray-200/90 rounded-xl shadow-2xs overflow-hidden flex flex-col animate-in fade-in duration-200">
                    <div className="p-3.5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60">
                        <form onSubmit={handleSearch} className="flex relative w-full sm:w-80">
                            <input
                                type="text"
                                placeholder="Cari nama, NIK, atau jabatan..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs bg-white shadow-2xs transition-all"
                            />
                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2" />
                            <button type="submit" className="hidden">Search</button>
                        </form>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-600 shrink-0">
                            <span className="text-xs font-medium text-gray-500">Tampilkan:</span>
                            <select 
                                value={filters.per_page || 25} 
                                onChange={handlePerPageChange}
                                className="border border-gray-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs bg-white shadow-2xs cursor-pointer font-semibold"
                            >
                                <option value="10">10</option>
                                <option value="15">15</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-270px)] relative">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="text-[11px] text-gray-500 uppercase bg-slate-50/95 backdrop-blur-xs border-b border-gray-200/80 sticky top-0 z-10 shadow-2xs">
                                <tr>
                                    <th className="px-4 py-3.5 font-bold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('employee_id')}>
                                        NIK <SortIcon column="employee_id" />
                                    </th>
                                    <th className="px-4 py-3.5 font-bold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('name')}>
                                        Nama Karyawan <SortIcon column="name" />
                                    </th>
                                    <th className="px-4 py-3.5 font-bold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('company_name')}>
                                        Perusahaan <SortIcon column="company_name" />
                                    </th>
                                    <th className="px-4 py-3.5 font-bold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('location_name')}>
                                        Lokasi <SortIcon column="location_name" />
                                    </th>
                                    <th className="px-4 py-3.5 font-bold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('organization_name')}>
                                        Departemen <SortIcon column="organization_name" />
                                    </th>
                                    <th className="px-4 py-3.5 font-bold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap" onClick={() => handleSort('job_title_name')}>
                                        Jabatan <SortIcon column="job_title_name" />
                                    </th>
                                    <th className="px-4 py-3.5 font-bold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-center" onClick={() => handleSort('job_level_code')}>
                                        Level <SortIcon column="job_level_code" />
                                    </th>
                                    <th className="px-4 py-3.5 font-bold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-center" onClick={() => handleSort('generasi')}>
                                        Generasi <SortIcon column="generasi" />
                                    </th>
                                    <th className="px-4 py-3.5 font-bold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right" onClick={() => handleSort('umur')}>
                                        Umur <SortIcon column="umur" />
                                    </th>
                                    <th className="px-4 py-3.5 font-bold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-right" onClick={() => handleSort('masa_kerja')}>
                                        Masa Kerja <SortIcon column="masa_kerja" />
                                    </th>
                                    <th className="px-4 py-3.5 font-bold cursor-pointer hover:bg-emerald-50/40 hover:text-emerald-900 transition whitespace-nowrap text-center" onClick={() => handleSort('employment_type')}>
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
                                            title="Klik untuk membuka detail profil"
                                        >
                                            <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700 whitespace-nowrap">
                                                <span className="bg-gray-100/70 text-gray-700 px-2 py-0.5 rounded border border-gray-200/50">
                                                    {emp.employee_id}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center space-x-3">
                                                    <EmployeeAvatar name={emp.name} photoUrl={emp.photo_url} size="sm" />
                                                    <span className="font-bold text-gray-900 group-hover:text-emerald-800 transition-colors">{emp.name}</span>
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
                            <div className="text-xs text-gray-500">
                                Menampilkan <span className="font-semibold text-gray-900">{employees.from}</span> - <span className="font-semibold text-gray-900">{employees.to}</span> dari <span className="font-semibold text-gray-900">{employees.total?.toLocaleString('id-ID')}</span> karyawan
                            </div>
                            <div className="flex items-center flex-wrap justify-center sm:justify-end gap-1">
                                {employees.links.map((link, i) => {
                                    const rawLabel = String(link.label || '');
                                    const labelLower = rawLabel.toLowerCase();
                                    const isPrev = labelLower.includes('previous') || rawLabel.includes('«') || rawLabel.includes('&laquo;');
                                    const isNext = labelLower.includes('next') || rawLabel.includes('»') || rawLabel.includes('&raquo;');
                                    
                                    return link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            preserveScroll
                                            preserveState
                                            className={`min-w-[2rem] h-8 px-2.5 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                                                link.active 
                                                    ? 'bg-[#004D40] text-white shadow-2xs font-bold' 
                                                    : 'text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-900'
                                            }`}
                                        >
                                            {isPrev ? <ChevronLeft size={14} /> : isNext ? <ChevronRight size={14} /> : <span>{link.label}</span>}
                                        </Link>
                                    ) : (
                                        <span key={i} className="min-w-[2rem] h-8 px-2.5 flex items-center justify-center text-xs font-medium text-gray-300">
                                            {isPrev ? <ChevronLeft size={14} /> : isNext ? <ChevronRight size={14} /> : <span>{link.label}</span>}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </AppLayout>
    );
}
