import { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import AppLayout from '@/Layouts/AppLayout';
import { ChartCard } from '@/Components/ui/ChartCard';
import { InfoTooltip } from '@/Components/ui/InfoTooltip';
import { StaffDetailModal } from '@/Components/staff/StaffDetailModal';
import EmployeeAvatar from '@/Components/EmployeeAvatar';
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { generationColors } from '@/lib/colors';
import { levelLabels } from '@/lib/constants';
import { formatNumber } from '@/lib/format';
import { 
    ArrowLeft, 
    Users, 
    Clock, 
    UserMinus, 
    GraduationCap, 
    Search, 
    MapPin, 
    ChevronLeft, 
    ChevronRight, 
    RotateCcw,
    Building2,
    Briefcase,
    ShieldAlert,
    X,
    Layers,
    Award
} from 'lucide-react';

const LEVEL_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', '1', '2', '3', '4', '5'];

const regionBadgeStyles = {
    Riau: 'bg-amber-100/90 text-amber-800 border-amber-200/60',
    Kalbar: 'bg-emerald-100/90 text-emerald-800 border-emerald-200/60',
    Kubar: 'bg-sky-100/90 text-sky-800 border-sky-200/60',
    Corp: 'bg-slate-200/90 text-slate-800 border-slate-300/60',
    Non: 'bg-purple-100/90 text-purple-800 border-purple-200/60',
};

function renderEmploymentBadge(type) {
    const normalized = (type || '').toUpperCase();
    if (normalized === 'PERMANENT' || normalized === 'PERM') {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Permanent
            </span>
        );
    }
    if (normalized === 'CONTRACT' || normalized === 'PKWT') {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                Contract
            </span>
        );
    }
    if (normalized === 'PROBATION') {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200/60">
                Probation
            </span>
        );
    }
    if (normalized === 'TRAINEE') {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200/60">
                Trainee
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            {type || '—'}
        </span>
    );
}

function SubtlePalmPattern() {
    return (
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none overflow-hidden" aria-hidden="true">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="palm-leaf-pattern" width="90" height="90" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
                        <path d="M45 5 C30 25, 15 45, 5 70 C25 65, 45 55, 60 40 M45 5 C60 25, 75 45, 85 70 C65 65, 45 55, 30 40 M45 5 L45 85" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#palm-leaf-pattern)" />
            </svg>
        </div>
    );
}

function ProfileTab({ profile, companyId, onLocationFilter }) {
    if (!profile) return null;
    const { generations, levels, departments, locations, training } = profile;

    // Generasi donut data
    const totalGen = Object.values(generations || {}).reduce((s, v) => s + v, 0);
    const genData = Object.entries(generations || {})
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ 
            name, 
            value, 
            pct: totalGen > 0 ? Math.round((value / totalGen) * 100) : 0,
            fill: generationColors[name] || '#94A3B8' 
        }));

    // Level bar data (urutan A-F lalu 1-5)
    const levelData = LEVEL_ORDER
        .filter(l => levels?.[l])
        .map(l => ({ name: l, label: `${l} - ${levelLabels[l] || l}`, value: levels[l] }));

    // Department top 8
    const deptData = Object.entries(departments || {})
        .slice(0, 8)
        .map(([name, value]) => ({ 
            name: name.length > 22 ? name.slice(0, 22) + '…' : name, 
            fullName: name,
            value 
        }));

    return (
        <div className="space-y-6">
            {/* Row 1: Generasi & Pelatihan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Donut generasi */}
                <ChartCard title="Komposisi Generasi" isEmpty={genData.length === 0} height="h-72">
                    <div className="flex flex-col sm:flex-row items-center justify-between h-full gap-4">
                        <div className="w-full sm:w-1/2 h-56 relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={genData} 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={55} 
                                        outerRadius={80} 
                                        dataKey="value" 
                                        paddingAngle={3}
                                    >
                                        {genData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                    </Pie>
                                    <RechartsTooltip 
                                        formatter={(v, n) => [
                                            `${formatNumber(v)} staf (${totalGen > 0 ? Math.round((v / totalGen) * 100) : 0}%)`, 
                                            n
                                        ]} 
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total</span>
                                <span className="text-base font-extrabold text-gray-900">{formatNumber(totalGen)}</span>
                            </div>
                        </div>

                        {/* Legenda Custom */}
                        <div className="w-full sm:w-1/2 space-y-2 text-xs">
                            {genData.map(item => (
                                <div key={item.name} className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                                        <span className="font-semibold text-gray-700">{item.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-gray-900">{formatNumber(item.value)}</span>
                                        <span className="text-gray-400 text-[10px] ml-1">({item.pct}%)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ChartCard>

                {/* Ringkasan Pelatihan */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                                    <GraduationCap size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base">Ringkasan Pelatihan SDM</h3>
                                    <p className="text-xs text-gray-400">Akumulasi keikutsertaan pelatihan karyawan</p>
                                </div>
                            </div>
                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                                Terverifikasi
                            </span>
                        </div>

                        {training ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-2">
                                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                                    <p className="text-[11px] text-gray-500 font-medium">Cakupan (Coverage)</p>
                                    <p className="text-2xl font-black text-emerald-700 mt-1">{training.coverage_pct}%</p>
                                    <p className="text-[10px] text-gray-400 mt-1">{training.trained_hc} dari {profile.kpi?.hc || 0} staf</p>
                                </div>
                                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                                    <p className="text-[11px] text-gray-500 font-medium">Total Jam Pelatihan</p>
                                    <p className="text-2xl font-black text-gray-900 mt-1">{formatNumber(training.total_hours)} <span className="text-xs font-normal text-gray-500">jam</span></p>
                                    <p className="text-[10px] text-gray-400 mt-1">Seluruh sesi training</p>
                                </div>
                                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                                    <p className="text-[11px] text-gray-500 font-medium">Rata-rata per Peserta</p>
                                    <p className="text-2xl font-black text-[#004D40] mt-1">
                                        {training.trained_hc > 0 ? (training.total_hours / training.trained_hc).toFixed(1) : 0} <span className="text-xs font-normal text-gray-500">jam</span>
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1">Khusus staf terlatih</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-xs">
                                Belum ada data pelatihan yang terhubung untuk perusahaan ini.
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1.5 text-gray-500">
                            <Award className="w-4 h-4 text-emerald-600" />
                            Data pelatihan disinkronkan otomatis dari Portal FR Academy
                        </span>
                    </div>
                </div>
            </div>

            {/* Row 2: Level Jabatan & Top Departemen */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Level bar */}
                <ChartCard title="Distribusi Level Jabatan" isEmpty={levelData.length === 0} height="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={levelData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
                            <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} width={28} />
                            <RechartsTooltip 
                                formatter={(v) => [formatNumber(v), 'Karyawan']} 
                                labelFormatter={(l) => levelLabels[l] ? `Level ${l} - ${levelLabels[l]}` : `Level ${l}`} 
                            />
                            <Bar dataKey="value" fill="#004D40" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Departemen top 8 */}
                <ChartCard title="Top 8 Departemen / Organisasi" isEmpty={deptData.length === 0} height="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deptData} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                            <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#334155' }} width={130} />
                            <RechartsTooltip 
                                formatter={(v) => [formatNumber(v), 'Karyawan']} 
                                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                            />
                            <Bar dataKey="value" fill="#2E7D32" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Row 3: Lokasi Operasional Perusahaan (Full Width) */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                            <MapPin className="text-emerald-700" size={18} />
                            Lokasi Operasional Perusahaan ({locations?.length || 0})
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Klik pada salah satu lokasi di bawah untuk melihat daftar staf yang ditugaskan di lokasi tersebut:
                        </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 self-start sm:self-auto">
                        Interaktif
                    </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                    {(locations || []).map(l => (
                        <button
                            key={l.id}
                            onClick={() => onLocationFilter(l)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs bg-gray-50/80 text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-900 transition-all font-medium group cursor-pointer"
                            title={`Filter staf di ${l.name}`}
                        >
                            <MapPin size={13} className="text-emerald-700 group-hover:scale-110 transition-transform" />
                            <span>{l.name}</span>
                            <span className="font-bold bg-white text-emerald-800 px-2 py-0.5 rounded-md border border-gray-200/60 shadow-2xs">
                                {l.count} staf
                            </span>
                        </button>
                    ))}
                    {(locations || []).length === 0 && (
                        <p className="text-gray-400 text-xs py-4">Tidak ada data lokasi yang terdaftar.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function StafTab({ companyId, initialLocationId = null, initialLocationName = null, filterOptions = null }) {
    const [employees, setEmployees] = useState(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [locationId, setLocationId] = useState(initialLocationId);
    const [locationName, setLocationName] = useState(initialLocationName);
    const [level, setLevel] = useState('');
    const [department, setDepartment] = useState('');
    const [employmentType, setEmploymentType] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedEmpId, setSelectedEmpId] = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams({ page, search: search || '' });
        if (locationId) params.append('location_id', locationId);
        if (level) params.append('level', level);
        if (department) params.append('department', department);
        if (employmentType) params.append('employment_type', employmentType);

        axios.get(`/data/companies/${companyId}/employees?${params}`).then(res => {
            setEmployees(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [companyId, page, search, locationId, level, department, employmentType]);

    useEffect(() => { load(); }, [load]);

    // Sync external location filter from profil tab
    useEffect(() => {
        if (initialLocationId) {
            setLocationId(initialLocationId);
            setLocationName(initialLocationName);
            setPage(1);
        }
    }, [initialLocationId, initialLocationName]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const hasActiveFilters = Boolean(locationId || level || department || employmentType || search);

    const resetFilters = () => {
        setLocationId(null);
        setLocationName(null);
        setLevel('');
        setDepartment('');
        setEmploymentType('');
        setSearch('');
        setPage(1);
    };

    return (
        <div className="space-y-4">
            {/* Filter controls toolbar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={handleSearch}
                            placeholder="Cari nama, NIK, atau jabatan staf..."
                            className="w-full pl-10 pr-9 py-2 text-sm bg-gray-50/70 hover:bg-gray-50 focus:bg-white rounded-xl border border-gray-200/80 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => { setSearch(''); setPage(1); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Level */}
                        <select
                            value={level}
                            onChange={(e) => { setLevel(e.target.value); setPage(1); }}
                            className="px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none cursor-pointer"
                        >
                            <option value="">Semua Level</option>
                            {(filterOptions?.levels || []).map(lvl => (
                                <option key={lvl} value={lvl}>{lvl} - {levelLabels[lvl] || lvl}</option>
                            ))}
                        </select>

                        {/* Departemen */}
                        <select
                            value={department}
                            onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
                            className="px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none max-w-[200px] truncate cursor-pointer"
                        >
                            <option value="">Semua Departemen</option>
                            {(filterOptions?.departments || []).map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>

                        {/* Status Kerja */}
                        <select
                            value={employmentType}
                            onChange={(e) => { setEmploymentType(e.target.value); setPage(1); }}
                            className="px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none cursor-pointer"
                        >
                            <option value="">Semua Status</option>
                            {(filterOptions?.employment_types || []).map(et => (
                                <option key={et} value={et}>{et}</option>
                            ))}
                        </select>

                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="inline-flex items-center gap-1 px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors font-medium border border-rose-100"
                            >
                                <RotateCcw size={12} /> Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter aktif chips */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 items-center text-xs pt-2 border-t border-gray-100">
                        <span className="text-gray-400 font-medium">Filter aktif:</span>
                        {locationId && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs">
                                <MapPin size={11} /> Lokasi: {locationName || 'Lokasi'}
                                <button onClick={() => { setLocationId(null); setLocationName(null); setPage(1); }} className="hover:text-amber-950 font-bold ml-1">×</button>
                            </span>
                        )}
                        {level && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
                                Level: {level}
                                <button onClick={() => { setLevel(''); setPage(1); }} className="hover:text-emerald-950 font-bold ml-1">×</button>
                            </span>
                        )}
                        {department && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs">
                                Dept: {department}
                                <button onClick={() => { setDepartment(''); setPage(1); }} className="hover:text-blue-950 font-bold ml-1">×</button>
                            </span>
                        )}
                        {employmentType && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs">
                                Status: {employmentType}
                                <button onClick={() => { setEmploymentType(''); setPage(1); }} className="hover:text-purple-950 font-bold ml-1">×</button>
                            </span>
                        )}
                        {search && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 text-xs">
                                Pencarian: "{search}"
                                <button onClick={() => { setSearch(''); setPage(1); }} className="hover:text-gray-950 font-bold ml-1">×</button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Table */}
            {loading ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : employees?.data?.length > 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden flex flex-col">
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="text-xs text-gray-500 uppercase bg-slate-50/95 backdrop-blur-xs border-b border-gray-200/80 sticky top-0 z-10 shadow-2xs">
                                <tr>
                                    <th className="px-5 py-3.5 font-semibold text-gray-600 tracking-wider whitespace-nowrap">Karyawan</th>
                                    <th className="px-5 py-3.5 font-semibold text-gray-600 tracking-wider whitespace-nowrap">Jabatan</th>
                                    <th className="px-5 py-3.5 font-semibold text-gray-600 tracking-wider whitespace-nowrap hidden sm:table-cell">Departemen</th>
                                    <th className="px-5 py-3.5 font-semibold text-gray-600 tracking-wider whitespace-nowrap text-center">Level</th>
                                    <th className="px-5 py-3.5 font-semibold text-gray-600 tracking-wider whitespace-nowrap text-center hidden md:table-cell">Umur</th>
                                    <th className="px-5 py-3.5 font-semibold text-gray-600 tracking-wider whitespace-nowrap text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {employees.data.map(emp => (
                                    <tr
                                        key={emp.employee_id}
                                        onClick={() => setSelectedEmpId(emp.employee_id)}
                                        className="hover:bg-emerald-50/30 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <EmployeeAvatar name={emp.name} photoUrl={emp.photo_url} size="sm" />
                                                <div>
                                                    <p className="font-semibold text-gray-900 group-hover:text-emerald-800 transition-colors">
                                                        {emp.name}
                                                    </p>
                                                    <p className="font-mono text-xs text-gray-400">{emp.employee_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-gray-700 whitespace-nowrap font-medium">
                                            {emp.job_title_name || '—'}
                                        </td>
                                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap hidden sm:table-cell text-xs">
                                            {emp.department || '—'}
                                        </td>
                                        <td className="px-5 py-3 text-center whitespace-nowrap">
                                            {emp.job_level_code ? (
                                                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-slate-200/60">
                                                    {emp.job_level_code}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-5 py-3 text-center text-gray-600 whitespace-nowrap hidden md:table-cell text-xs">
                                            {emp.age ? `${emp.age} th` : '—'}
                                        </td>
                                        <td className="px-5 py-3 text-center whitespace-nowrap">
                                            {renderEmploymentBadge(emp.employment_type)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
                        <p className="text-sm text-gray-500">
                            Menampilkan <span className="font-semibold text-gray-900">{formatNumber(employees.from)}</span> - <span className="font-semibold text-gray-900">{formatNumber(employees.to)}</span> dari <span className="font-semibold text-gray-900">{formatNumber(employees.total)}</span> staf
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="min-w-[2rem] h-8 px-2 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-50 hover:text-emerald-900 transition-colors text-xs font-medium"
                            >
                                <ChevronLeft size={15} />
                            </button>
                            <span className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-50 rounded-lg border border-gray-200/80">
                                {employees.current_page} / {employees.last_page}
                            </span>
                            <button
                                disabled={page >= employees.last_page}
                                onClick={() => setPage(p => p + 1)}
                                className="min-w-[2rem] h-8 px-2 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-50 hover:text-emerald-900 transition-colors text-xs font-medium"
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-2xs">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-4 border border-gray-100">
                        <Users size={32} className="opacity-50" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Tidak ada staf ditemukan</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        Tidak ada staf yang sesuai dengan kriteria filter atau pencarian di perusahaan ini.
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={resetFilters}
                            className="mt-4 inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                        >
                            Reset Filter &amp; Pencarian
                        </button>
                    )}
                </div>
            )}

            {selectedEmpId && (
                <StaffDetailModal 
                    employeeId={selectedEmpId} 
                    onClose={() => setSelectedEmpId(null)} 
                />
            )}
        </div>
    );
}

export default function CompanyShow({ companyCode, companyId }) {
    const [profile, setProfile] = useState(null);
    const [company, setCompany] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [tab, setTab] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('tab') || 'profil';
        }
        return 'profil';
    });

    // Cross-tab location filter from Profil -> Staf
    const [filterLocation, setFilterLocation] = useState({ id: null, name: null });

    useEffect(() => {
        axios.get(`/data/companies/${companyId}/profile`).then(res => {
            setProfile(res.data);
            setLoadingProfile(false);
        }).catch(() => setLoadingProfile(false));

        // Fetch company info for banner
        axios.get('/data/companies').then(res => {
            const found = (res.data.data || []).find(c => String(c.id) === String(companyId));
            if (found) setCompany(found);
        });
    }, [companyId]);

    const handleTabChange = (t) => {
        setTab(t);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', t);
        window.history.replaceState({}, '', url.toString());
    };

    const handleLocationFilter = (loc) => {
        setFilterLocation({ id: loc.id, name: loc.name });
        handleTabChange('staf');
    };

    const regionBadgeClass = company?.region ? (regionBadgeStyles[company.region] || 'bg-white/20 text-white border-white/30') : 'bg-white/20 text-white border-white/30';

    return (
        <AppLayout title={company?.name || companyCode}>
            <Head title={`${company?.name || companyCode} — Detail Perusahaan`} />

            {/* Banner Header Korporat yang Halus */}
            <div className="relative bg-gradient-to-r from-[#00332a] via-[#004D40] to-[#0d5238] rounded-2xl overflow-hidden mb-6 text-white shadow-sm border border-emerald-900/30">
                <SubtlePalmPattern />
                <div className="relative z-10 p-6 sm:p-7">
                    <Link
                        href="/perusahaan"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-100 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl backdrop-blur-xs transition-colors mb-4 border border-white/15"
                    >
                        <ArrowLeft size={14} /> Kembali ke Galeri Perusahaan
                    </Link>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-xs font-bold bg-white/15 text-white px-2.5 py-0.5 rounded-lg border border-white/20 backdrop-blur-xs">
                                    {companyCode}
                                </span>
                                {company?.region && (
                                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg border backdrop-blur-xs ${regionBadgeClass}`}>
                                        Region {company.region}
                                    </span>
                                )}
                                {company?.group && (
                                    <span className="text-xs font-medium text-emerald-100 bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10 backdrop-blur-xs">
                                        {company.group}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                {company?.name || companyCode}
                            </h1>
                        </div>

                        {company?.location_count > 0 && (
                            <div className="flex items-center gap-2 bg-white/10 border border-white/15 backdrop-blur-xs rounded-xl px-4 py-2 self-start sm:self-auto">
                                <MapPin size={16} className="text-emerald-300" />
                                <span className="text-xs font-semibold text-white">
                                    {company.location_count} Unit Operasional
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 4 Mini KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {loadingProfile ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                    ))
                ) : (
                    <>
                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center justify-between relative hover:z-40 focus-within:z-40">
                            <div>
                                <div className="flex items-center gap-1">
                                    <p className="text-xs text-gray-500 font-medium">Headcount</p>
                                    <InfoTooltip title="Total Headcount" text="Total seluruh karyawan aktif yang terdaftar di entitas perusahaan ini." />
                                </div>
                                <p className="text-2xl font-black text-gray-900 mt-0.5">
                                    {profile?.kpi?.hc?.toLocaleString('id-ID') || 0}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Total karyawan aktif</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                                <Users size={18} />
                            </div>
                        </div>

                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center justify-between relative hover:z-40 focus-within:z-40">
                            <div>
                                <div className="flex items-center gap-1">
                                    <p className="text-xs text-gray-500 font-medium">Rata-rata Umur</p>
                                    <InfoTooltip title="Rata-rata Umur" text="Rata-rata usia karyawan perusahaan ini dihitung dari tanggal lahir." />
                                </div>
                                <p className="text-2xl font-black text-gray-900 mt-0.5">
                                    {profile?.kpi?.avg_age || 0} <span className="text-xs font-normal text-gray-500">th</span>
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Seluruh jenjang</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                                <Clock size={18} />
                            </div>
                        </div>

                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center justify-between relative hover:z-40 focus-within:z-40">
                            <div>
                                <div className="flex items-center gap-1">
                                    <p className="text-xs text-gray-500 font-medium">Rata-rata Masa Kerja</p>
                                    <InfoTooltip title="Rata-rata Masa Kerja" text="Rata-rata lama masa pengabdian (Length of Service) dihitung sejak tanggal bergabung (join date)." />
                                </div>
                                <p className="text-2xl font-black text-gray-900 mt-0.5">
                                    {profile?.kpi?.avg_los || 0} <span className="text-xs font-normal text-gray-500">th</span>
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Loyalitas karyawan</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
                                <Briefcase size={18} />
                            </div>
                        </div>

                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center justify-between relative hover:z-40 focus-within:z-40">
                            <div>
                                <div className="flex items-center gap-1">
                                    <p className="text-xs text-gray-500 font-medium">Risiko Pensiun</p>
                                    <InfoTooltip title="Risiko Pensiun" text="Jumlah karyawan perusahaan ini yang berusia 55 tahun ke atas atau akan pensiun dalam ≤ 5 tahun." />
                                </div>
                                <p className={`text-2xl font-black mt-0.5 ${profile?.kpi?.pensiun > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                                    {profile?.kpi?.pensiun || 0} <span className="text-xs font-normal text-gray-500">orang</span>
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Pensiun dalam ≤ 5 tahun</p>
                            </div>
                            <div className={`p-2.5 rounded-xl ${profile?.kpi?.pensiun > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>
                                <UserMinus size={18} />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Segmented Pill Tabs */}
            <div className="flex items-center p-1 bg-gray-100/90 rounded-2xl w-fit mb-6 border border-gray-200/50">
                <button
                    onClick={() => handleTabChange('profil')}
                    className={`flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                        tab === 'profil'
                            ? 'bg-white text-[#004D40] shadow-2xs'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <Building2 size={16} />
                    <span>Profil &amp; Demografi</span>
                </button>
                <button
                    onClick={() => handleTabChange('staf')}
                    className={`flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                        tab === 'staf'
                            ? 'bg-white text-[#004D40] shadow-2xs'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <Users size={16} />
                    <span>Daftar Staf (SDM)</span>
                    {profile?.kpi?.hc > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tab === 'staf' ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                            {profile.kpi.hc.toLocaleString('id-ID')}
                        </span>
                    )}
                </button>
            </div>

            {/* Tab Content */}
            {tab === 'profil' && (
                <ProfileTab
                    profile={profile}
                    companyId={companyId}
                    onLocationFilter={handleLocationFilter}
                />
            )}
            {tab === 'staf' && (
                <StafTab
                    companyId={companyId}
                    initialLocationId={filterLocation.id}
                    initialLocationName={filterLocation.name}
                    filterOptions={profile?.filter_options}
                />
            )}
        </AppLayout>
    );
}
