import { useState, useEffect, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import AppLayout from '@/Layouts/AppLayout';
import { InfoTooltip } from '@/Components/ui/InfoTooltip';
import { 
    Search, 
    Building2, 
    Users, 
    MapPin, 
    LayoutGrid, 
    List, 
    ArrowUpDown, 
    ChevronRight,
    X,
    Briefcase
} from 'lucide-react';
import { generationColors } from '@/lib/colors';

// Warna per region yang lebih lembut & harmonis
const regionStyles = {
    Riau: { 
        avatar: 'bg-amber-100 text-amber-800 border border-amber-200/60',
        badge: 'bg-amber-50 text-amber-700 border border-amber-200/60'
    },
    Kalbar: { 
        avatar: 'bg-emerald-100 text-emerald-800 border border-emerald-200/60',
        badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
    },
    Kubar: { 
        avatar: 'bg-sky-100 text-sky-800 border border-sky-200/60',
        badge: 'bg-sky-50 text-sky-700 border border-sky-200/60'
    },
    Corp: { 
        avatar: 'bg-slate-100 text-slate-800 border border-slate-200/60',
        badge: 'bg-slate-50 text-slate-700 border border-slate-200/60'
    },
    Non: { 
        avatar: 'bg-purple-100 text-purple-800 border border-purple-200/60',
        badge: 'bg-purple-50 text-purple-700 border border-purple-200/60'
    },
};

const fallbackRegionStyle = { 
    avatar: 'bg-gray-100 text-gray-700 border border-gray-200/60',
    badge: 'bg-gray-50 text-gray-600 border border-gray-200/60'
};

function getInitials(name = '') {
    const clean = name.replace(/^PT\.?\s+/i, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

function CompanyCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xs animate-pulse flex flex-col justify-between h-[210px]">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-200" />
                    <div className="h-5 bg-gray-200 rounded-md w-16" />
                </div>
                <div className="h-5 bg-gray-200 rounded w-4/5 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="pt-4 border-t border-gray-100">
                <div className="h-2 bg-gray-200 rounded-full w-full" />
            </div>
        </div>
    );
}

function GenerationBar({ generations = {} }) {
    const total = Object.values(generations).reduce((s, v) => s + v, 0);
    if (total === 0) return null;
    const gens = Object.entries(generations).filter(([, v]) => v > 0);

    return (
        <div className="mt-3.5">
            <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5 font-medium">
                <span>Generasi</span>
                <span className="text-gray-400">
                    {gens.map(([name, val]) => `${name} (${Math.round((val / total) * 100)}%)`).slice(0, 2).join(' · ')}
                </span>
            </div>
            <div className="flex w-full h-2 rounded-full overflow-hidden bg-gray-100 gap-0.5">
                {gens.map(([name, val]) => {
                    const pct = Math.round((val / total) * 100);
                    return (
                        <div
                            key={name}
                            style={{ 
                                width: `${(val / total) * 100}%`, 
                                backgroundColor: generationColors[name] || '#94A3B8' 
                            }}
                            title={`${name}: ${val.toLocaleString('id-ID')} staf (${pct}%)`}
                            className="transition-all hover:opacity-80"
                        />
                    );
                })}
            </div>
        </div>
    );
}

function CompanyCard({ company }) {
    const style = regionStyles[company.region] || fallbackRegionStyle;

    return (
        <Link
            href={`/perusahaan/${company.code}`}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xs hover:shadow-md hover:border-emerald-200/70 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group cursor-pointer h-full"
        >
            <div>
                {/* Header Card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl ${style.avatar} flex items-center justify-center text-sm font-bold tracking-wide shrink-0 transition-transform group-hover:scale-105 duration-200`}>
                        {getInitials(company.name)}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100/80 px-2 py-0.5 rounded-md border border-gray-200/50">
                            {company.code}
                        </span>
                        <div className="flex items-center gap-1">
                            {company.region && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
                                    {company.region}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Company Name & Group */}
                <h3 className="font-bold text-gray-900 group-hover:text-[#004D40] transition-colors text-base line-clamp-1 leading-snug">
                    {company.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-gray-400" />
                    {company.group || 'FR Group'}
                </p>

                {/* Metrics Stats */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100/80">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                            <Users size={14} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-medium">Headcount</p>
                            <p className="text-xs font-bold text-gray-900">
                                {company.employee_count?.toLocaleString('id-ID')} <span className="font-normal text-gray-500">HC</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                            <MapPin size={14} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-medium">Operasional</p>
                            <p className="text-xs font-bold text-gray-900">
                                {company.location_count} <span className="font-normal text-gray-500">Lokasi</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Generation composition bar */}
            {company.generations && <GenerationBar generations={company.generations} />}
        </Link>
    );
}

function CompanyRowItem({ company }) {
    const style = regionStyles[company.region] || fallbackRegionStyle;

    return (
        <Link
            href={`/perusahaan/${company.code}`}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs hover:shadow-sm hover:border-emerald-200/70 transition-all duration-150 group"
        >
            <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-11 h-11 rounded-xl ${style.avatar} flex items-center justify-center text-sm font-bold tracking-wide shrink-0`}>
                    {getInitials(company.name)}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-sm truncate group-hover:text-[#004D40] transition-colors">
                            {company.name}
                        </p>
                        <span className="font-mono text-[11px] font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200/50">
                            {company.code}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {company.group || 'FR Group'} · Region {company.region || '—'}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 text-xs text-gray-600 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                <div className="flex items-center gap-1.5">
                    <Users size={14} className="text-emerald-700" />
                    <span className="font-bold text-gray-900 text-sm">{company.employee_count?.toLocaleString('id-ID')}</span>
                    <span className="text-gray-400">HC</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-emerald-700" />
                    <span className="font-bold text-gray-900 text-sm">{company.location_count}</span>
                    <span className="text-gray-400">Lokasi</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                    <ChevronRight size={16} />
                </div>
            </div>
        </Link>
    );
}

const REGIONS = ['Riau', 'Kalbar', 'Kubar', 'Corp', 'Non'];

export default function CompanyIndex() {
    const [companies, setCompanies] = useState([]);
    const [totalLocations, setTotalLocations] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeRegion, setActiveRegion] = useState('Semua');
    const [sort, setSort] = useState('hc'); // hc | az
    const [viewMode, setViewMode] = useState('grid'); // grid | list

    useEffect(() => {
        axios.get('/data/companies').then(res => {
            setCompanies(res.data.data || []);
            setTotalLocations(res.data.total_locations || 0);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    // Hitung jumlah per region untuk chip
    const regionCounts = useMemo(() => {
        return REGIONS.reduce((acc, r) => {
            acc[r] = companies.filter(c => c.region === r).length;
            return acc;
        }, {});
    }, [companies]);

    const filtered = useMemo(() => {
        let list = companies;
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.code.toLowerCase().includes(q) ||
                (c.group || '').toLowerCase().includes(q) ||
                (c.region || '').toLowerCase().includes(q)
            );
        }
        if (activeRegion !== 'Semua') {
            list = list.filter(c => c.region === activeRegion);
        }
        if (sort === 'az') {
            list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        } else {
            list = [...list].sort((a, b) => b.employee_count - a.employee_count);
        }
        return list;
    }, [companies, search, activeRegion, sort]);

    const totalHc = filtered.reduce((s, c) => s + (c.employee_count || 0), 0);

    return (
        <AppLayout title="Galeri Perusahaan">
            <Head title="Galeri Perusahaan" />

            {/* Header Title & Subtitle */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Galeri Perusahaan</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Eksplorasi entitas operasional FR Group, sebaran tenaga kerja, dan fasilitas unit.
                    </p>
                </div>

                {/* 3 Executive Metric Cards */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2.5 shadow-2xs border border-gray-100 relative hover:z-40 focus-within:z-40">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                            <Users size={16} />
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Total HC</p>
                                <InfoTooltip title="Total Headcount" text="Akumulasi seluruh karyawan aktif pada unit-unit perusahaan terfilter." />
                            </div>
                            <p className="text-sm font-extrabold text-gray-900">{totalHc.toLocaleString('id-ID')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2.5 shadow-2xs border border-gray-100 relative hover:z-40 focus-within:z-40">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                            <Building2 size={16} />
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Perusahaan</p>
                                <InfoTooltip title="Jumlah Perusahaan" text="Jumlah entitas unit bisnis / PT yang terdaftar dan sesuai filter aktif." />
                            </div>
                            <p className="text-sm font-extrabold text-gray-900">{filtered.length}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2.5 shadow-2xs border border-gray-100 relative hover:z-40 focus-within:z-40">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                            <MapPin size={16} />
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Lokasi</p>
                                <InfoTooltip title="Total Lokasi Kerja" text="Total persebaran unit kantor atau site operasional terdata." />
                            </div>
                            <p className="text-sm font-extrabold text-gray-900">{totalLocations}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Toolbar Container */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-4 mb-6 space-y-3.5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari nama, kode perusahaan, grup, atau region..."
                            className="w-full pl-10 pr-9 py-2 text-sm bg-gray-50/70 hover:bg-gray-50 focus:bg-white rounded-xl border border-gray-200/80 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Sort & View Mode Toggle */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setSort(s => s === 'hc' ? 'az' : 'hc')}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors"
                            title="Ubah Urutan"
                        >
                            <ArrowUpDown size={13} className="text-gray-500" />
                            <span>{sort === 'hc' ? 'HC Terbanyak' : 'Nama (A–Z)'}</span>
                        </button>

                        <div className="flex items-center bg-gray-100/80 p-0.5 rounded-xl border border-gray-200/50">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-2xs text-[#004D40]' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Tampilan Grid"
                            >
                                <LayoutGrid size={15} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-2xs text-[#004D40]' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Tampilan Daftar"
                            >
                                <List size={15} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Region Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-400 mr-1">Region:</span>
                    {['Semua', ...REGIONS].map(r => {
                        const count = r === 'Semua' ? companies.length : (regionCounts[r] || 0);
                        if (r !== 'Semua' && count === 0) return null;
                        const active = activeRegion === r;
                        return (
                            <button
                                key={r}
                                onClick={() => setActiveRegion(r)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                    active
                                        ? 'bg-[#004D40] text-white border-[#004D40] shadow-2xs font-semibold'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-800'
                                }`}
                            >
                                {r}
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Gallery Grid or List */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => <CompanyCardSkeleton key={i} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-2xs">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-4 border border-gray-100">
                        <Building2 size={32} className="opacity-50" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Tidak ada perusahaan ditemukan</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        Tidak ada perusahaan yang sesuai dengan kata kunci pencarian atau filter region saat ini.
                    </p>
                    {(search || activeRegion !== 'Semua') && (
                        <button
                            onClick={() => { setSearch(''); setActiveRegion('Semua'); }}
                            className="mt-4 inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                        >
                            Reset Pencarian &amp; Filter
                        </button>
                    )}
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(c => <CompanyCard key={c.id} company={c} />)}
                </div>
            ) : (
                <div className="space-y-2.5">
                    {filtered.map(c => <CompanyRowItem key={c.id} company={c} />)}
                </div>
            )}
        </AppLayout>
    );
}
