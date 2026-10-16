import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, 
    Calendar, 
    Users, 
    Clock, 
    TrendingUp, 
    MapPin, 
    Search, 
    ChevronLeft, 
    ChevronRight, 
    Eye, 
    ExternalLink, 
    Briefcase,
    Building2,
    Shield,
    Sparkles,
    UserCheck
} from 'lucide-react';
import { formatNumber } from '@/lib/format';
import EmployeeAvatar from '@/Components/EmployeeAvatar';

export function CohortDetailModal({ cohort, isPeak, onClose, onSelectEmployee }) {
    const [activeTab, setActiveTab] = useState('distribution'); // 'distribution' | 'employees'
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);

    const searchTimeoutRef = useRef(null);

    // Close on Escape key and lock body scroll
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = originalOverflow;
        };
    }, [onClose]);

    // Fetch employee list when tab is active or search/filters change
    useEffect(() => {
        if (activeTab !== 'employees') return;

        setLoading(true);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(() => {
            const params = new URLSearchParams();
            if (searchTerm.trim()) params.append('search', searchTerm.trim());
            if (selectedLevel !== 'ALL') params.append('level', selectedLevel);
            params.append('page', String(page));

            fetch(`/data/cohort/${cohort.year}/employees?${params.toString()}`)
                .then((res) => {
                    if (!res.ok) throw new Error('Gagal mengambil data personil');
                    return res.json();
                })
                .then((data) => {
                    setEmployees(data.data || []);
                    setTotalPages(data.last_page || 1);
                    setTotalResults(data.total || 0);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error('Error fetching cohort employees:', err);
                    setEmployees([]);
                    setLoading(false);
                });
        }, 250);

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [activeTab, cohort.year, searchTerm, selectedLevel, page]);

    if (!cohort) return null;

    const totalHC = cohort.total || 1;

    // Helper for visual bars
    const renderProgressBar = (label, count, total, colorClass = 'bg-[#004D40]') => {
        const pct = Math.round((count / total) * 100);
        return (
            <div key={label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">{label}</span>
                    <span className="text-gray-500 font-medium">
                        <strong className="text-gray-900">{formatNumber(count)}</strong> org ({pct}%)
                    </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${colorClass}`} 
                        style={{ width: `${Math.max(pct, 2)}%` }} 
                    />
                </div>
            </div>
        );
    };

    return createPortal(
        <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9990] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Modal */}
                <div className="px-5 sm:px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#004D40] border border-emerald-100/60 shrink-0">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                                    Detail Angkatan Rekrutmen {cohort.year}
                                </h2>
                                {isPeak && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70 inline-flex items-center gap-1">
                                        <TrendingUp size={11} /> Angkatan Terbanyak
                                    </span>
                                )}
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                                    Dominan: {cohort.dominant_type}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Analisis komprehensif personil bergabung pada tahun {cohort.year} ({formatNumber(cohort.total)} total personil aktif).
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer shrink-0"
                        title="Tutup (Esc)"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* KPI Summary Cards */}
                <div className="px-5 sm:px-6 pt-4 pb-2 bg-slate-50/60 border-b border-gray-100 shrink-0">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white p-3 rounded-2xl border border-gray-200/60 shadow-2xs">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Personil</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-gray-900">{formatNumber(cohort.total)}</span>
                                <span className="text-xs text-gray-500 font-medium">orang</span>
                            </div>
                        </div>

                        <div className="bg-white p-3 rounded-2xl border border-gray-200/60 shadow-2xs">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Rata-rata Masa Kerja</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-emerald-700">{cohort.avg_tenure || '-'}</span>
                                <span className="text-xs text-gray-500 font-medium">tahun</span>
                            </div>
                        </div>

                        <div className="bg-white p-3 rounded-2xl border border-gray-200/60 shadow-2xs">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Rata-rata Usia Masuk</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-teal-700">{cohort.avg_join_age || '-'}</span>
                                <span className="text-xs text-gray-500 font-medium">tahun</span>
                            </div>
                        </div>

                        <div className="bg-white p-3 rounded-2xl border border-gray-200/60 shadow-2xs">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Status Kepegawaian</span>
                            <div className="text-xs font-bold text-gray-800 truncate" title={cohort.dominant_type}>
                                {cohort.dominant_type || 'PERMANENT'}
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 mt-4">
                        <button
                            type="button"
                            onClick={() => setActiveTab('distribution')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'distribution'
                                    ? 'bg-[#004D40] text-white shadow-xs'
                                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200/70'
                            }`}
                        >
                            Komposisi &amp; Distribusi
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('employees')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'employees'
                                    ? 'bg-[#004D40] text-white shadow-xs'
                                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200/70'
                            }`}
                        >
                            <Users size={13} />
                            <span>Daftar Personil ({formatNumber(cohort.total)})</span>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-5 sm:p-6 overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
                    {activeTab === 'distribution' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Card 1: Job Level Composition */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-200/70 shadow-2xs space-y-3.5">
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                                        <Briefcase size={14} className="text-emerald-600" />
                                        Distribusi Job Level
                                    </h4>
                                    <span className="text-[11px] font-semibold text-gray-500">
                                        {Object.keys(cohort.levels || {}).length} Jenjang
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {Object.entries(cohort.levels || {}).map(([lvl, count]) => (
                                        renderProgressBar(`Level ${lvl}`, count, totalHC, 'bg-emerald-600')
                                    ))}
                                    {(!cohort.levels || Object.keys(cohort.levels).length === 0) && (
                                        <p className="text-xs text-gray-400 italic">Data job level tidak tersedia.</p>
                                    )}
                                </div>
                            </div>

                            {/* Card 2: Region Distribution */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-200/70 shadow-2xs space-y-3.5">
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                                        <MapPin size={14} className="text-teal-600" />
                                        Sebaran Penempatan Wilayah
                                    </h4>
                                    <span className="text-[11px] font-semibold text-gray-500">
                                        {Object.keys(cohort.regions || {}).length} Region
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {Object.entries(cohort.regions || {}).map(([reg, count]) => (
                                        renderProgressBar(reg, count, totalHC, 'bg-[#004D40]')
                                    ))}
                                    {(!cohort.regions || Object.keys(cohort.regions).length === 0) && (
                                        <p className="text-xs text-gray-400 italic">Data region tidak tersedia.</p>
                                    )}
                                </div>
                            </div>

                            {/* Card 3: Employment Types */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-200/70 shadow-2xs space-y-3.5">
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                                        <Shield size={14} className="text-blue-600" />
                                        Status Kepegawaian
                                    </h4>
                                    <span className="text-[11px] font-semibold text-gray-500">
                                        {Object.keys(cohort.types || {}).length} Status
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {Object.entries(cohort.types || {}).map(([type, count]) => (
                                        renderProgressBar(type, count, totalHC, 'bg-blue-600')
                                    ))}
                                </div>
                            </div>

                            {/* Card 4: Gender Breakdown */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-200/70 shadow-2xs space-y-3.5">
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                                        <Users size={14} className="text-purple-600" />
                                        Komposisi Gender
                                    </h4>
                                </div>
                                <div className="space-y-3">
                                    {Object.entries(cohort.genders || {}).map(([gen, count]) => {
                                        const isFemale = gen === 'Female' || gen === 'Perempuan' || gen === 'Wanita' || gen === 'P';
                                        const isMale = gen === 'Male' || gen === 'Laki-laki' || gen === 'Pria' || gen === 'L';
                                        const label = isFemale ? 'Perempuan' : (isMale ? 'Laki-laki' : gen);
                                        const color = isFemale ? 'bg-pink-500' : (isMale ? 'bg-indigo-600' : 'bg-purple-600');
                                        return renderProgressBar(label, count, totalHC, color);
                                    })}
                                    {(!cohort.genders || Object.keys(cohort.genders).length === 0) && (
                                        <p className="text-xs text-gray-400 italic">Data gender tidak tersedia.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Tab 2: Employee List Table */
                        <div className="space-y-4">
                            {/* Filter and Search Bar */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Cari berdasarkan nama, NIK, atau jabatan..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setPage(1);
                                        }}
                                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedLevel}
                                        onChange={(e) => {
                                            setSelectedLevel(e.target.value);
                                            setPage(1);
                                        }}
                                        className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    >
                                        <option value="ALL">Semua Level</option>
                                        {Object.keys(cohort.levels || {}).map((lvl) => (
                                            <option key={lvl} value={lvl}>Level {lvl}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Table Container */}
                            <div className="border border-gray-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="bg-slate-50/80 text-gray-600 font-semibold border-b border-gray-200/70">
                                            <tr>
                                                <th className="px-4 py-3">Personil</th>
                                                <th className="px-4 py-3">Jabatan &amp; Level</th>
                                                <th className="px-4 py-3">Perusahaan &amp; Region</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Tgl Masuk</th>
                                                <th className="px-4 py-3 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-gray-700">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                                        <div className="flex flex-col items-center justify-center gap-2">
                                                            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                                            <span>Memuat daftar personil angkatan {cohort.year}...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : employees.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                                        Tidak ada personil yang sesuai dengan kriteria pencarian.
                                                    </td>
                                                </tr>
                                            ) : (
                                                employees.map((emp) => (
                                                    <tr 
                                                        key={emp.id}
                                                        onClick={() => onSelectEmployee(emp.employee_id)}
                                                        className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <EmployeeAvatar
                                                                    name={emp.name}
                                                                    photoUrl={emp.photo_url}
                                                                    size="sm"
                                                                />
                                                                <div className="min-w-0">
                                                                    <div className="font-bold text-gray-900 group-hover:text-emerald-800 transition-colors truncate">
                                                                        {emp.name}
                                                                    </div>
                                                                    <div className="text-[11px] text-gray-400">
                                                                        NIK: {emp.employee_id}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-gray-800 truncate max-w-[200px]" title={emp.job_title_name}>
                                                                {emp.job_title_name || '-'}
                                                            </div>
                                                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                                                Level {emp.job_level_code || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-semibold text-gray-800">
                                                                {emp.company_code} - {emp.region}
                                                            </div>
                                                            <div className="text-[11px] text-gray-400 truncate max-w-[150px]">
                                                                {emp.department || '-'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                                emp.employment_type === 'PERMANENT'
                                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                                                    : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                                                            }`}>
                                                                {emp.employment_type || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 font-medium">
                                                            {emp.join_date}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onSelectEmployee(emp.employee_id);
                                                                }}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                                                            >
                                                                <Eye size={12} />
                                                                <span>Profil</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="px-4 py-3 bg-slate-50/70 border-t border-gray-200/70 flex items-center justify-between text-xs text-gray-600">
                                        <span>
                                            Menampilkan <strong>{employees.length}</strong> dari <strong>{totalResults}</strong> personil
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                                disabled={page <= 1}
                                                className="p-1 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <span className="px-2 font-semibold text-gray-800">
                                                {page} / {totalPages}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                                disabled={page >= totalPages}
                                                className="p-1 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Modal */}
                <div className="px-5 sm:px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
                    <a
                        href={`/karyawan?search=${encodeURIComponent(cohort.year)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                        <span>Buka Direktori Karyawan</span>
                        <ExternalLink size={12} />
                    </a>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200 transition-colors cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
