import React, { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, 
    LineChart, Line 
} from 'recharts';
import { 
    TrendingDown, TrendingUp, Users, UserMinus, UserCheck, 
    Filter, RotateCcw, Download, Plus, Search, Eye, Edit, Trash2, 
    Sparkles, Calendar, MapPin, Briefcase, Award, AlertCircle, 
    CheckCircle2, X, ChevronLeft, ChevronRight, Layers, FileSpreadsheet,
    UploadCloud
} from 'lucide-react';

export default function ResignationIndex({ metrics, records, filters = {}, filterOptions = {}, flash = {} }) {
    // Current Active Tab: 'dashboard' | 'data'
    const [activeTab, setActiveTab] = useState(filters.tab || 'dashboard');

    // Filter states
    const [yearFilter, setYearFilter] = useState(filters.year || 'all');
    const [regionFilter, setRegionFilter] = useState(filters.region || 'all');
    const [jenisFilter, setJenisFilter] = useState(filters.jenis_resign || 'all');
    const [clusterFilter, setClusterFilter] = useState(filters.cluster_resign || 'all');
    const [alumniFilter, setAlumniFilter] = useState(filters.alumni || 'all');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [perPage, setPerPage] = useState(filters.per_page || 15);

    // Modals
    const [detailItem, setDetailItem] = useState(null);
    const [editItem, setEditItem] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [deleteItem, setDeleteItem] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Import State
    const [importFile, setImportFile] = useState(null);
    const [importMode, setImportMode] = useState('append');
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Form state for Add/Edit
    const [formData, setFormData] = useState({
        employee_id: '',
        nama: '',
        join_date: '',
        resign_date: '',
        jabatan: 'Asisten Kebun',
        kebun: '',
        region: 'Riau',
        jenis_resign: 'VOLUNTARY',
        cluster_resign: 'Pindah Perusahaan',
        alumni: 'Non Alumni',
        keterangan: '',
        deskripsi_resign: ''
    });

    const applyFilter = (newFilters) => {
        const merged = {
            tab: activeTab,
            year: yearFilter,
            region: regionFilter,
            jenis_resign: jenisFilter,
            cluster_resign: clusterFilter,
            alumni: alumniFilter,
            search: searchQuery,
            per_page: perPage,
            ...newFilters
        };

        // Cleanup 'all' and empty values
        const clean = {};
        Object.keys(merged).forEach(key => {
            if (merged[key] && merged[key] !== 'all') {
                clean[key] = merged[key];
            }
        });
        if (activeTab === 'data') {
            clean.tab = 'data';
        }

        router.get('/resign', clean, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handlePerPageChange = (e) => {
        const newPerPage = e.target.value;
        setPerPage(newPerPage);
        applyFilter({ per_page: newPerPage, page: 1 });
    };

    const handleResetFilter = () => {
        setYearFilter('all');
        setRegionFilter('all');
        setJenisFilter('all');
        setClusterFilter('all');
        setAlumniFilter('all');
        setSearchQuery('');
        router.get('/resign', activeTab === 'data' ? { tab: 'data' } : {}, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilter({ search: searchQuery });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (yearFilter !== 'all') params.append('year', yearFilter);
        if (regionFilter !== 'all') params.append('region', regionFilter);
        if (jenisFilter !== 'all') params.append('jenis_resign', jenisFilter);
        window.location.href = `/resign/export?${params.toString()}`;
    };

    const openAddModal = () => {
        setFormData({
            employee_id: '',
            nama: '',
            join_date: '',
            resign_date: new Date().toISOString().split('T')[0],
            jabatan: filterOptions.jabatans?.[0] || 'Asisten Kebun',
            kebun: '',
            region: 'Riau',
            jenis_resign: 'VOLUNTARY',
            cluster_resign: filterOptions.clusters?.[0] || 'Pindah Perusahaan',
            alumni: 'Non Alumni',
            keterangan: '',
            deskripsi_resign: ''
        });
        setIsAddModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditItem(item);
        setFormData({
            employee_id: item.employee_id === '-' ? '' : item.employee_id,
            nama: item.nama,
            join_date: item.join_date_raw || '',
            resign_date: item.resign_date_raw || '',
            jabatan: item.jabatan,
            kebun: item.kebun,
            region: item.region,
            jenis_resign: item.jenis_resign,
            cluster_resign: item.cluster_resign,
            alumni: item.alumni,
            keterangan: item.keterangan === '-' ? '' : item.keterangan,
            deskripsi_resign: item.deskripsi_resign === '-' ? '' : item.deskripsi_resign
        });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (editItem) {
            router.put(`/resign/${editItem.id}`, formData, {
                preserveScroll: true,
                onSuccess: () => {
                    setEditItem(null);
                    setIsSubmitting(false);
                },
                onError: () => setIsSubmitting(false)
            });
        } else {
            router.post('/resign', formData, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsAddModalOpen(false);
                    setIsSubmitting(false);
                },
                onError: () => setIsSubmitting(false)
            });
        }
    };

    const handleDeleteSubmit = () => {
        if (!deleteItem) return;
        setIsSubmitting(true);
        router.delete(`/resign/${deleteItem.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteItem(null);
                setIsSubmitting(false);
            },
            onError: () => setIsSubmitting(false)
        });
    };

    const handleImportSubmit = (e) => {
        e.preventDefault();
        if (!importFile) return;

        setIsUploading(true);
        const data = new FormData();
        data.append('file', importFile);
        data.append('mode', importMode);

        router.post('/resign/import', data, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsImportModalOpen(false);
                setImportFile(null);
                setIsUploading(false);
            },
            onError: () => {
                setIsUploading(false);
            }
        });
    };

    const kpis = metrics?.kpis || {};
    const clusterData = metrics?.cluster_data || [];
    const jabatanData = metrics?.jabatan_data || [];
    const yearCurrent = metrics?.year_current || 2026;
    const yearPrevious = metrics?.year_previous || (yearCurrent - 1);
    const topKebunPrev = metrics?.top_kebun_prev || metrics?.top_kebun_2025 || [];
    const topKebunCurr = metrics?.top_kebun_curr || metrics?.top_kebun_2026 || [];
    const monthlyTrend = metrics?.monthly_trend || [];
    const insights = metrics?.insights || [];

    // Pre-calculate KPI helper values for clear, high-contrast executive presentation
    const totalCountPrev = kpis.total?.count_prev ?? kpis.total?.count_2025 ?? 0;
    const totalCountCurr = kpis.total?.count_curr ?? kpis.total?.count_2026 ?? 0;
    const totalDisplay = yearFilter === String(yearCurrent) 
        ? totalCountCurr 
        : (yearFilter === String(yearPrevious) ? totalCountPrev : (totalCountPrev + totalCountCurr));

    const vtCountPrev = kpis.vt?.count_prev ?? kpis.vt?.count_2025 ?? 0;
    const vtCountCurr = kpis.vt?.count_curr ?? kpis.vt?.count_2026 ?? 0;
    const vtDisplay = yearFilter === String(yearCurrent)
        ? vtCountCurr
        : (yearFilter === String(yearPrevious) ? vtCountPrev : (vtCountPrev + vtCountCurr));
    const vtPctPrev = kpis.vt?.pct_prev ?? kpis.vt?.pct_2025 ?? 0;
    const vtPctCurr = kpis.vt?.pct_curr ?? kpis.vt?.pct_2026 ?? 0;
    const vtPctDisplay = yearFilter === String(yearCurrent) ? vtPctCurr : vtPctPrev;

    const itCountPrev = kpis.it?.count_prev ?? kpis.it?.count_2025 ?? 0;
    const itCountCurr = kpis.it?.count_curr ?? kpis.it?.count_2026 ?? 0;
    const itDisplay = yearFilter === String(yearCurrent)
        ? itCountCurr
        : (yearFilter === String(yearPrevious) ? itCountPrev : (itCountPrev + itCountCurr));
    const itPctPrev = kpis.it?.pct_prev ?? kpis.it?.pct_2025 ?? 0;
    const itPctCurr = kpis.it?.pct_curr ?? kpis.it?.pct_2026 ?? 0;
    const itPctDisplay = yearFilter === String(yearCurrent) ? itPctCurr : itPctPrev;

    const alumniCountPrev = kpis.alumni?.count_prev ?? kpis.alumni?.count_2025 ?? 0;
    const alumniCountCurr = kpis.alumni?.count_curr ?? kpis.alumni?.count_2026 ?? 0;
    const alumniDisplay = yearFilter === String(yearCurrent)
        ? alumniCountCurr
        : (yearFilter === String(yearPrevious) ? alumniCountPrev : (alumniCountPrev + alumniCountCurr));
    const alumniPctPrev = kpis.alumni?.pct_prev ?? kpis.alumni?.pct_2025 ?? 0;
    const alumniPctCurr = kpis.alumni?.pct_curr ?? kpis.alumni?.pct_2026 ?? 0;
    const alumniPctDisplay = yearFilter === String(yearCurrent) ? alumniPctCurr : alumniPctPrev;

    const nonAlumniCountPrev = kpis.non_alumni?.count_prev ?? kpis.non_alumni?.count_2025 ?? 0;
    const nonAlumniCountCurr = kpis.non_alumni?.count_curr ?? kpis.non_alumni?.count_2026 ?? 0;
    const nonAlumniDisplay = yearFilter === String(yearCurrent)
        ? nonAlumniCountCurr
        : (yearFilter === String(yearPrevious) ? nonAlumniCountPrev : (nonAlumniCountPrev + nonAlumniCountCurr));
    const nonAlumniPctPrev = kpis.non_alumni?.pct_prev ?? kpis.non_alumni?.pct_2025 ?? 0;
    const nonAlumniPctCurr = kpis.non_alumni?.pct_curr ?? kpis.non_alumni?.pct_2026 ?? 0;
    const nonAlumniPctDisplay = yearFilter === String(yearCurrent) ? nonAlumniPctCurr : nonAlumniPctPrev;

    return (
        <AppLayout>
            <Head title="Monitoring Turnover & Resign - Monitoring Operation" />

            <div className="space-y-6 pb-12">
                {/* TOP EXECUTIVE HEADER (Flat Canvas Header) */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Turnover & Resign Staff
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Analisis dinamika keluarnya karyawan operasional perkebunan (Perbandingan Th. {yearPrevious} vs Th. {yearCurrent}).
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl shadow-2xs border border-gray-200/60 self-start sm:self-auto">
                        <button
                            onClick={() => {
                                setActiveTab('dashboard');
                                applyFilter({ tab: 'dashboard' });
                            }}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'dashboard'
                                    ? 'bg-white text-[#004D40] shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-slate-200/60'
                            }`}
                        >
                            <Sparkles size={14} className={activeTab === 'dashboard' ? 'text-emerald-600' : 'text-gray-400'} />
                            <span>Dashboard Resign</span>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('data');
                                applyFilter({ tab: 'data' });
                            }}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'data'
                                    ? 'bg-white text-[#004D40] shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-slate-200/60'
                            }`}
                        >
                            <Layers size={14} className={activeTab === 'data' ? 'text-emerald-600' : 'text-gray-400'} />
                            <span>Data Karyawan Resign</span>
                            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                                {records?.total || 0}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Notification Flash Message */}
                {flash?.success && (
                    <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium animate-fadeIn">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mr-1">
                            <Filter size={14} />
                            <span>Filter:</span>
                        </div>

                        {/* Tahun Filter */}
                        <div className="relative">
                            <select
                                value={yearFilter}
                                onChange={(e) => {
                                    setYearFilter(e.target.value);
                                    applyFilter({ year: e.target.value });
                                }}
                                className="appearance-none bg-slate-50 border border-gray-200 text-gray-800 text-xs font-semibold rounded-xl px-3 py-1.5 pr-8 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                            >
                                <option value="all">Semua Tahun</option>
                                {(filterOptions?.years || [yearCurrent, yearPrevious]).map((yr) => (
                                    <option key={yr} value={yr}>
                                        Tahun {yr}
                                    </option>
                                ))}
                            </select>
                            <Calendar size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Region Filter */}
                        <div className="relative">
                            <select
                                value={regionFilter}
                                onChange={(e) => {
                                    setRegionFilter(e.target.value);
                                    applyFilter({ region: e.target.value });
                                }}
                                className="appearance-none bg-slate-50 border border-gray-200 text-gray-800 text-xs font-semibold rounded-xl px-3 py-1.5 pr-8 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                            >
                                <option value="all">Semua Region</option>
                                <option value="Riau">Riau</option>
                                <option value="Kalbar">Kalbar</option>
                                <option value="Kaltim">Kaltim</option>
                            </select>
                            <MapPin size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Extra filters for Tab 2 (Data Karyawan) */}
                        {activeTab === 'data' && (
                            <>
                                <select
                                    value={jenisFilter}
                                    onChange={(e) => {
                                        setJenisFilter(e.target.value);
                                        applyFilter({ jenis_resign: e.target.value });
                                    }}
                                    className="bg-slate-50 border border-gray-200 text-gray-800 text-xs font-semibold rounded-xl px-3 py-1.5 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                >
                                    <option value="all">Semua Jenis Resign</option>
                                    <option value="VOLUNTARY">Voluntary (VT)</option>
                                    <option value="INVOLUNTARY">Involuntary (IT)</option>
                                </select>

                                <select
                                    value={alumniFilter}
                                    onChange={(e) => {
                                        setAlumniFilter(e.target.value);
                                        applyFilter({ alumni: e.target.value });
                                    }}
                                    className="bg-slate-50 border border-gray-200 text-gray-800 text-xs font-semibold rounded-xl px-3 py-1.5 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                >
                                    <option value="all">Semua Status Alumni</option>
                                    <option value="Alumni">Alumni</option>
                                    <option value="Non Alumni">Non Alumni</option>
                                </select>

                                <select
                                    value={clusterFilter}
                                    onChange={(e) => {
                                        setClusterFilter(e.target.value);
                                        applyFilter({ cluster_resign: e.target.value });
                                    }}
                                    className="bg-slate-50 border border-gray-200 text-gray-800 text-xs font-semibold rounded-xl px-3 py-1.5 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer max-w-[180px] truncate"
                                >
                                    <option value="all">Semua Cluster Resign</option>
                                    {filterOptions.clusters?.map(cl => (
                                        <option key={cl} value={cl}>{cl}</option>
                                    ))}
                                </select>
                            </>
                        )}

                        {/* Reset Filter Button */}
                        <button
                            onClick={handleResetFilter}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-rose-600 bg-gray-50 hover:bg-rose-50 border border-gray-200 hover:border-rose-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                            title="Reset Semua Filter"
                        >
                            <RotateCcw size={12} />
                            <span>Reset</span>
                        </button>
                    </div>

                    {/* Action buttons (Import, Export & Add) */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {activeTab === 'data' && (
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3.5 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
                                title="Import Data dari File Excel (.xlsx, .xls) atau CSV"
                            >
                                <UploadCloud size={14} />
                                <span>Import Excel / CSV</span>
                            </button>
                        )}
                        <button
                            onClick={handleExport}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-gray-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
                            title="Unduh Laporan Format CSV"
                        >
                            <Download size={14} />
                            <span>Export CSV</span>
                        </button>
                        {activeTab === 'data' && (
                            <button
                                onClick={openAddModal}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#004D40] hover:bg-[#00382e] px-3.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
                            >
                                <Plus size={14} />
                                <span>Tambah Data Resign</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* TAB 1: DASHBOARD RESIGN STAFF */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* 5 KPI Metric Cards with YoY Comparison (Optimized for Senior Executive / Boomer Readability) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {/* Card 1: Total Resign */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
                                <div>
                                    <div className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                                        Total Resign Staff
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl sm:text-[34px] font-black tracking-tight text-slate-900 tabular-nums leading-none">
                                            {totalDisplay}
                                        </span>
                                        <span className="text-xs sm:text-sm font-bold text-slate-500">orang</span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <div className="text-xs text-slate-700">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Th. {yearPrevious}</span>
                                        <span className="text-sm font-black text-slate-900 tabular-nums">{totalCountPrev}</span>
                                    </div>
                                    <div className="text-xs text-slate-700 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Th. {yearCurrent}</span>
                                            <span className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.2 rounded text-[11px] ${
                                                (kpis.total?.diff ?? 0) <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                            }`}>
                                                {(kpis.total?.diff ?? 0) <= 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                                                {(kpis.total?.diff_pct ?? 0) > 0 ? `+${kpis.total?.diff_pct}%` : `${kpis.total?.diff_pct}%`}
                                            </span>
                                        </div>
                                        <span className="text-sm font-black text-emerald-800 tabular-nums">{totalCountCurr}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Voluntary (VT) */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
                                <div>
                                    <div className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                                        Voluntary (VT)
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl sm:text-[34px] font-black tracking-tight text-slate-900 tabular-nums leading-none">
                                            {vtDisplay}
                                        </span>
                                        <span className="text-xs sm:text-[13px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/70">
                                            {vtPctDisplay}%
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <div className="text-xs text-slate-700">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Th. {yearPrevious}</span>
                                        <div className="flex items-baseline gap-1 mt-0.5">
                                            <span className="text-sm font-black text-slate-900 tabular-nums">{vtCountPrev}</span>
                                            <span className="text-xs font-semibold text-slate-500">({vtPctPrev}%)</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-700 text-right">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Th. {yearCurrent}</span>
                                        <div className="flex items-baseline justify-end gap-1 mt-0.5">
                                            <span className="text-sm font-black text-slate-900 tabular-nums">{vtCountCurr}</span>
                                            <span className="text-xs font-semibold text-slate-500">({vtPctCurr}%)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Involuntary (IT) */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
                                <div>
                                    <div className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                                        Involuntary (IT)
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl sm:text-[34px] font-black tracking-tight text-slate-900 tabular-nums leading-none">
                                            {itDisplay}
                                        </span>
                                        <span className="text-xs sm:text-[13px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/70">
                                            {itPctDisplay}%
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <div className="text-xs text-slate-700">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Th. {yearPrevious}</span>
                                        <div className="flex items-baseline gap-1 mt-0.5">
                                            <span className="text-sm font-black text-slate-900 tabular-nums">{itCountPrev}</span>
                                            <span className="text-xs font-semibold text-slate-500">({itPctPrev}%)</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-700 text-right">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Th. {yearCurrent}</span>
                                        <div className="flex items-baseline justify-end gap-1 mt-0.5">
                                            <span className="text-sm font-black text-slate-900 tabular-nums">{itCountCurr}</span>
                                            <span className="text-xs font-semibold text-slate-500">({itPctCurr}%)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: Alumni FRLC */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
                                <div>
                                    <div className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                                        Alumni FRLC
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl sm:text-[34px] font-black tracking-tight text-slate-900 tabular-nums leading-none">
                                            {alumniDisplay}
                                        </span>
                                        <span className="text-xs sm:text-[13px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/70">
                                            {alumniPctDisplay}%
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <div className="text-xs text-slate-700">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Th. {yearPrevious}</span>
                                        <div className="flex items-baseline gap-1 mt-0.5">
                                            <span className="text-sm font-black text-slate-900 tabular-nums">{alumniCountPrev}</span>
                                            <span className="text-xs font-semibold text-slate-500">({alumniPctPrev}%)</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-700 text-right">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Th. {yearCurrent}</span>
                                        <div className="flex items-baseline justify-end gap-1 mt-0.5">
                                            <span className="text-sm font-black text-slate-900 tabular-nums">{alumniCountCurr}</span>
                                            <span className="text-xs font-semibold text-slate-500">({alumniPctCurr}%)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 5: Non Alumni */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
                                <div>
                                    <div className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                                        Non Alumni
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl sm:text-[34px] font-black tracking-tight text-slate-900 tabular-nums leading-none">
                                            {nonAlumniDisplay}
                                        </span>
                                        <span className="text-xs sm:text-[13px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70">
                                            {nonAlumniPctDisplay}%
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <div className="text-xs text-slate-700">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Th. {yearPrevious}</span>
                                        <div className="flex items-baseline gap-1 mt-0.5">
                                            <span className="text-sm font-black text-slate-900 tabular-nums">{nonAlumniCountPrev}</span>
                                            <span className="text-xs font-semibold text-slate-500">({nonAlumniPctPrev}%)</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-700 text-right">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Th. {yearCurrent}</span>
                                        <div className="flex items-baseline justify-end gap-1 mt-0.5">
                                            <span className="text-sm font-black text-slate-900 tabular-nums">{nonAlumniCountCurr}</span>
                                            <span className="text-xs font-semibold text-slate-500">({nonAlumniPctCurr}%)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Executive AI Insights Card */}
                        <div className="bg-gradient-to-r from-emerald-900 via-[#004D40] to-emerald-950 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-emerald-400/20 rounded-lg text-emerald-300">
                                    <Sparkles size={18} />
                                </div>
                                <h3 className="text-sm font-bold tracking-wide uppercase text-emerald-200">
                                    Executive Summary & Highlight Operasional
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs text-emerald-50/90 leading-relaxed">
                                {insights.map((point, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                        <span>{point}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ROW 1: DUAL COMPARISON CHARTS (Cluster & Jabatan) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Chart 1: Cluster Penyebab Resign */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">
                                            Cluster Penyebab Resign ({yearPrevious} vs {yearCurrent})
                                        </h3>
                                        <p className="text-[11px] text-gray-500">
                                            Frekuensi alasan pengunduran diri staf operasional kebun
                                        </p>
                                    </div>
                                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        {clusterData.length} Kategori
                                    </span>
                                </div>
                                <div className="h-[360px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={clusterData}
                                            layout="vertical"
                                            margin={{ top: 5, right: 30, left: 110, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                                            <XAxis type="number" tick={{ fontSize: 11 }} />
                                            <YAxis 
                                                type="category" 
                                                dataKey="cluster" 
                                                tick={{ fontSize: 10, fill: '#475569' }} 
                                                width={110} 
                                            />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} 
                                            />
                                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                                            <Bar dataKey="y_prev" name={`Th. ${yearPrevious}`} fill="#94A3B8" radius={[0, 4, 4, 0]} />
                                            <Bar dataKey="y_curr" name={`Th. ${yearCurrent}`} fill="#0D9488" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Chart 2: Cluster Resign by Jabatan */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">
                                            Resign Berdasarkan Jabatan Operasional
                                        </h3>
                                        <p className="text-[11px] text-gray-500">
                                            Komposisi level posisi yang mengundurkan diri ({yearPrevious} vs {yearCurrent})
                                        </p>
                                    </div>
                                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        Top Posisi
                                    </span>
                                </div>
                                <div className="h-[360px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={jabatanData.slice(0, 6)}
                                            margin={{ top: 20, right: 20, left: 0, bottom: 25 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                            <XAxis 
                                                dataKey="jabatan" 
                                                tick={{ fontSize: 10, fill: '#475569' }} 
                                                interval={0} 
                                                angle={-15} 
                                                textAnchor="end" 
                                            />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} 
                                            />
                                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                                            <Bar dataKey="y_prev" name={`Th. ${yearPrevious}`} fill="#94A3B8" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="y_curr" name={`Th. ${yearCurrent}`} fill="#059669" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* ROW 2: MONTHLY TREND LINE CHART */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">
                                        Trend Turnover Karyawan Per Bulan (Januari - Desember)
                                    </h3>
                                    <p className="text-[11px] text-gray-500">
                                        Fluktuasi ritme pengunduran diri staf bulanan membedakan Voluntary (VT) & Involuntary (IT)
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="inline-flex items-center gap-1.5 text-gray-600">
                                        <span className="w-3 h-0.5 bg-[#004D40]" /> Total {yearCurrent}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-blue-600">
                                        <span className="w-3 h-0.5 bg-blue-500" /> VT {yearCurrent}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-amber-600">
                                        <span className="w-3 h-0.5 bg-amber-500" /> IT {yearCurrent}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-gray-400">
                                        <span className="w-3 h-0.5 border-t border-dashed border-gray-400" /> Total {yearPrevious}
                                    </span>
                                </div>
                            </div>
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} 
                                        />
                                        <Line type="monotone" dataKey="total_curr" name={`Total ${yearCurrent}`} stroke="#004D40" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="vt_curr" name={`Voluntary ${yearCurrent}`} stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="it_curr" name={`Involuntary ${yearCurrent}`} stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="total_prev" name={`Total ${yearPrevious} (Prev)`} stroke="#CBD5E1" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* ROW 3: TOP 10 KEBUN SEBARAN */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top 10 Kebun Th. Previous */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-bold text-gray-900">
                                        Sebaran Top 10 Per Kebun (Th. {yearPrevious})
                                    </h3>
                                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                        Data Historis {yearPrevious}
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                                                <th className="py-2.5 px-3">No</th>
                                                <th className="py-2.5 px-3">Nama Kebun</th>
                                                <th className="py-2.5 px-3 text-right">Voluntary</th>
                                                <th className="py-2.5 px-3 text-right">Involuntary</th>
                                                <th className="py-2.5 px-3 text-right font-extrabold text-gray-700">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {topKebunPrev.map((row, idx) => (
                                                <tr key={row.kebun} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="py-2.5 px-3 font-semibold text-gray-400">{idx + 1}</td>
                                                    <td className="py-2.5 px-3 font-bold text-gray-800">{row.kebun}</td>
                                                    <td className="py-2.5 px-3 text-right text-blue-600 font-medium">{row.vt}</td>
                                                    <td className="py-2.5 px-3 text-right text-amber-600 font-medium">{row.it}</td>
                                                    <td className="py-2.5 px-3 text-right font-extrabold text-gray-900">{row.total}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Top 10 Kebun Th. Current */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-bold text-gray-900">
                                        Sebaran Top 10 Per Kebun (Th. {yearCurrent})
                                    </h3>
                                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        Data Berjalan {yearCurrent}
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                                                <th className="py-2.5 px-3">No</th>
                                                <th className="py-2.5 px-3">Nama Kebun</th>
                                                <th className="py-2.5 px-3 text-right">Voluntary</th>
                                                <th className="py-2.5 px-3 text-right">Involuntary</th>
                                                <th className="py-2.5 px-3 text-right font-extrabold text-gray-700">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {topKebunCurr.map((row, idx) => (
                                                <tr key={row.kebun} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="py-2.5 px-3 font-semibold text-gray-400">{idx + 1}</td>
                                                    <td className="py-2.5 px-3 font-bold text-gray-800">{row.kebun}</td>
                                                    <td className="py-2.5 px-3 text-right text-blue-600 font-medium">{row.vt}</td>
                                                    <td className="py-2.5 px-3 text-right text-amber-600 font-medium">{row.it}</td>
                                                    <td className="py-2.5 px-3 text-right font-extrabold text-gray-900">{row.total}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* ROW 4: ANALISIS KATEGORI CLUSTER RESIGN MATRIX */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">
                                        Analisis Kategori Cluster Resign
                                    </h3>
                                    <p className="text-[11px] text-gray-500">
                                        Rincian perbandingan kuantitas, rasio persentase dan dinamika pertumbuhan tahun ke tahun
                                    </p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                                            <th className="py-3 px-3">Kategori Cluster Resign</th>
                                            <th className="py-3 px-3 text-center">Th. {yearPrevious}</th>
                                            <th className="py-3 px-3 text-center">% {yearPrevious}</th>
                                            <th className="py-3 px-3 text-center">Th. {yearCurrent}</th>
                                            <th className="py-3 px-3 text-center">% {yearCurrent}</th>
                                            <th className="py-3 px-3 text-center text-blue-700">VT</th>
                                            <th className="py-3 px-3 text-center text-amber-700">IT</th>
                                            <th className="py-3 px-3 text-right">Pertumbuhan YoY</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {clusterData.map((row) => (
                                            <tr key={row.cluster} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-2.5 px-3 font-bold text-gray-900">{row.cluster}</td>
                                                <td className="py-2.5 px-3 text-center text-gray-600 font-medium">{row.y_prev ?? row.y2025}</td>
                                                <td className="py-2.5 px-3 text-center text-gray-500">{row.pct_prev ?? row.pct_2025}%</td>
                                                <td className="py-2.5 px-3 text-center font-bold text-emerald-800">{row.y_curr ?? row.y2026}</td>
                                                <td className="py-2.5 px-3 text-center text-emerald-700 font-semibold">{row.pct_curr ?? row.pct_2026}%</td>
                                                <td className="py-2.5 px-3 text-center text-blue-600 font-medium">{row.vt}</td>
                                                <td className="py-2.5 px-3 text-center text-amber-600 font-medium">{row.it}</td>
                                                <td className="py-2.5 px-3 text-right">
                                                    <span className={`inline-flex items-center gap-0.5 font-bold px-2 py-0.5 rounded-full text-[11px] ${
                                                        row.diff <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                                    }`}>
                                                        {row.diff <= 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                                                        {row.diff > 0 ? `+${row.diff}` : row.diff} ({row.diff_pct > 0 ? `+${row.diff_pct}%` : `${row.diff_pct}%`})
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: DATA KARYAWAN RESIGN (TABLE & MANAGEMENT) */}
                {activeTab === 'data' && (
                    <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
                        {/* Search Bar & Stats */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari NIK, Nama Karyawan, Kebun, Jabatan..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-20 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#004D40] hover:bg-[#00382e] text-white text-[11px] font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer"
                                >
                                    Cari
                                </button>
                            </form>

                            <div className="text-xs text-gray-500 font-medium">
                                Menampilkan <b className="text-gray-900">{records?.data?.length || 0}</b> dari <b className="text-gray-900">{records?.total || 0}</b> data karyawan resign
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50/80 text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
                                        <th className="py-3 px-3">NIK</th>
                                        <th className="py-3 px-3">Nama Karyawan</th>
                                        <th className="py-3 px-3">Jabatan</th>
                                        <th className="py-3 px-3">Kebun / Unit</th>
                                        <th className="py-3 px-3">Region</th>
                                        <th className="py-3 px-3">Tgl Join</th>
                                        <th className="py-3 px-3">Tgl Resign</th>
                                        <th className="py-3 px-3">Masa Kerja</th>
                                        <th className="py-3 px-3">Klasifikasi Resign</th>
                                        <th className="py-3 px-3">Alumni</th>
                                        <th className="py-3 px-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {records?.data?.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="py-12 text-center text-gray-400">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <AlertCircle size={28} className="text-gray-300" />
                                                    <span className="font-semibold">Tidak ada data karyawan resign yang sesuai filter</span>
                                                    <button 
                                                        onClick={handleResetFilter} 
                                                        className="text-xs text-emerald-700 underline font-semibold mt-1"
                                                    >
                                                        Reset Filter
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        records?.data?.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3 px-3 font-mono font-medium text-slate-500 text-xs">{item.employee_id}</td>
                                                <td className="py-3 px-3 font-bold text-slate-900 text-xs">{item.nama}</td>
                                                <td className="py-3 px-3 text-slate-600 text-xs">{item.jabatan}</td>
                                                <td className="py-3 px-3 font-semibold text-slate-800 text-xs">{item.kebun}</td>
                                                <td className="py-3 px-3">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        item.region === 'Riau' 
                                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' 
                                                            : (item.region === 'Kalbar' 
                                                                ? 'bg-blue-50 text-blue-800 border border-blue-200/60' 
                                                                : 'bg-amber-50 text-amber-800 border border-amber-200/60')
                                                    }`}>
                                                        {item.region}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-slate-500 whitespace-nowrap text-xs">{item.join_date}</td>
                                                <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap text-xs">{item.resign_date}</td>
                                                <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap text-xs tabular-nums">{item.tenure}</td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                                                            item.jenis_resign === 'VOLUNTARY' ? 'bg-sky-500' : 'bg-rose-500'
                                                        }`} />
                                                        <span className="font-semibold text-slate-900 text-xs">{item.cluster_resign}</span>
                                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                                            item.jenis_resign === 'VOLUNTARY' ? 'bg-sky-50 text-sky-700 border border-sky-200/60' : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                                                        }`}>
                                                            {item.jenis_resign === 'VOLUNTARY' ? 'VT' : 'IT'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                        item.alumni === 'Alumni'
                                                            ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {item.alumni}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => setDetailItem(item)}
                                                            className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                                            title="Lihat Detail Alasan Resign"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(item)}
                                                            className="p-1.5 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                                            title="Edit Data"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteItem(item)}
                                                            className="p-1.5 text-gray-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                            title="Hapus Data"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination & Per Page Selector */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                            {/* Left: Info & Per Page Dropdown */}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                <div>
                                    Menampilkan <b className="text-gray-900">{records.from || 0}</b> - <b className="text-gray-900">{records.to || 0}</b> dari <b className="text-gray-900">{records.total || 0}</b> karyawan
                                </div>
                                <span className="text-gray-300 hidden sm:inline">|</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-gray-600 font-medium">Tampilkan:</span>
                                    <select
                                        value={perPage}
                                        onChange={handlePerPageChange}
                                        className="bg-slate-50 border border-gray-200 text-gray-800 text-xs font-semibold rounded-lg px-2.5 py-1 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                                    >
                                        <option value="10">10 baris</option>
                                        <option value="15">15 baris</option>
                                        <option value="25">25 baris</option>
                                        <option value="50">50 baris</option>
                                        <option value="100">100 baris</option>
                                    </select>
                                </div>
                            </div>

                            {/* Right: Modern Pagination with Icons */}
                            {records?.links && records.links.length > 3 && (
                                <div className="flex items-center flex-wrap justify-center sm:justify-end gap-1">
                                    {records.links.map((link, idx) => {
                                        const rawLabel = String(link.label || '');
                                        const labelLower = rawLabel.toLowerCase();
                                        const isPrev = labelLower.includes('previous') || rawLabel.includes('«') || rawLabel.includes('&laquo;') || labelLower.includes('pagination.previous');
                                        const isNext = labelLower.includes('next') || rawLabel.includes('»') || rawLabel.includes('&raquo;') || labelLower.includes('pagination.next');

                                        return link.url ? (
                                            <button
                                                key={idx}
                                                onClick={() => router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                                className={`min-w-[2rem] h-8 px-2.5 flex items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                                    link.active
                                                        ? 'bg-[#004D40] text-white shadow-xs font-bold'
                                                        : 'bg-white text-gray-700 hover:bg-slate-100 border border-gray-200 shadow-2xs'
                                                }`}
                                                title={isPrev ? 'Halaman Sebelumnya' : isNext ? 'Halaman Berikutnya' : `Halaman ${link.label}`}
                                            >
                                                {isPrev ? (
                                                    <ChevronLeft size={15} />
                                                ) : isNext ? (
                                                    <ChevronRight size={15} />
                                                ) : (
                                                    <span>{link.label}</span>
                                                )}
                                            </button>
                                        ) : (
                                            <span
                                                key={idx}
                                                className="min-w-[2rem] h-8 px-2.5 flex items-center justify-center rounded-lg text-xs font-medium text-gray-300 bg-gray-50/60 border border-gray-100 cursor-not-allowed"
                                            >
                                                {isPrev ? (
                                                    <ChevronLeft size={15} />
                                                ) : isNext ? (
                                                    <ChevronRight size={15} />
                                                ) : (
                                                    <span>{link.label}</span>
                                                )}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL 1: DETAIL KARYAWAN RESIGN */}
            {detailItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-scaleIn">
                        {/* Header Modern Clean White */}
                        <div className="px-6 py-4.5 bg-white border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#004D40] border border-emerald-100/80 flex items-center justify-center shrink-0">
                                    <Briefcase size={18} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                                        Detail Resign: {detailItem.nama}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                                        NIK: {detailItem.employee_id || '-'} · {detailItem.kebun} ({detailItem.region})
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setDetailItem(null)}
                                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                                title="Tutup"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-gray-100">
                                <div>
                                    <span className="text-gray-400 font-bold block text-[10px] uppercase">NIK / ID</span>
                                    <span className="font-mono font-bold text-gray-800">{detailItem.employee_id}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Region & Kebun</span>
                                    <span className="font-bold text-gray-800">{detailItem.kebun} ({detailItem.region})</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Jabatan Terakhir</span>
                                    <span className="font-semibold text-gray-800">{detailItem.jabatan}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Status Alumni</span>
                                    <span className="font-semibold text-purple-700">{detailItem.alumni} ({detailItem.keterangan})</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Periode Kerja</span>
                                    <span className="font-medium text-gray-700">{detailItem.join_date} s/d {detailItem.resign_date}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Masa Pengabdian</span>
                                    <span className="font-bold text-emerald-800">{detailItem.tenure}</span>
                                </div>
                                <div className="col-span-2 pt-3 mt-1 border-t border-slate-200/80 bg-white p-3.5 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Alasan & Cluster</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${detailItem.jenis_resign === 'VOLUNTARY' ? 'bg-sky-500' : 'bg-rose-500'}`} />
                                            <span className="text-sm font-bold text-slate-900">{detailItem.cluster_resign}</span>
                                        </div>
                                    </div>
                                    <div className="sm:text-right">
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Jalur Pengunduran Diri</span>
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md ${
                                            detailItem.jenis_resign === 'VOLUNTARY'
                                                ? 'bg-sky-50 text-sky-800 border border-sky-200/70'
                                                : 'bg-rose-50 text-rose-800 border border-rose-200/70'
                                        }`}>
                                            {detailItem.jenis_resign === 'VOLUNTARY' ? 'Voluntary (Sukarela)' : 'Involuntary (PHK/Tindakan)'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider mb-1.5">
                                    Catatan Wawancara Keluar (Exit Interview):
                                </span>
                                <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl text-slate-800 text-xs leading-relaxed font-normal">
                                    "{detailItem.deskripsi_resign}"
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50/80 px-6 py-3.5 border-t border-gray-100 flex justify-end rounded-b-2xl">
                            <button
                                onClick={() => setDetailItem(null)}
                                className="px-5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: TAMBAH / EDIT KARYAWAN RESIGN */}
            {(isAddModalOpen || editItem) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-8 animate-scaleIn">
                        {/* Header Modern Clean White */}
                        <div className="px-6 py-4.5 bg-white border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#004D40] border border-emerald-100/80 flex items-center justify-center shrink-0">
                                    {editItem ? <Edit size={18} /> : <Plus size={18} />}
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                                        {editItem ? 'Edit Data Karyawan Resign' : 'Tambah Karyawan Resign'}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {editItem ? 'Perbarui informasi mutasi atau resign karyawan' : 'Input data mutasi atau pengunduran diri staf operasional'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setEditItem(null);
                                }}
                                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                                title="Tutup"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-5 space-y-3.5 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">NIK (Nomor Induk Karyawan)</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: 2021040292"
                                        value={formData.employee_id}
                                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Nama Lengkap *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Nama Karyawan"
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Tanggal Bergabung (Join Date)</label>
                                    <input
                                        type="date"
                                        value={formData.join_date}
                                        onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Tanggal Resign *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.resign_date}
                                        onChange={(e) => setFormData({ ...formData, resign_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Jabatan *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Asisten Kebun"
                                        value={formData.jabatan}
                                        onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Kebun / Unit *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: CPK, PSA"
                                        value={formData.kebun}
                                        onChange={(e) => setFormData({ ...formData, kebun: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Region *</label>
                                    <select
                                        value={formData.region}
                                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                                    >
                                        <option value="Riau">Riau</option>
                                        <option value="Kalbar">Kalbar</option>
                                        <option value="Kaltim">Kaltim</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Jenis Resign *</label>
                                    <select
                                        value={formData.jenis_resign}
                                        onChange={(e) => setFormData({ ...formData, jenis_resign: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                                    >
                                        <option value="VOLUNTARY">VOLUNTARY</option>
                                        <option value="INVOLUNTARY">INVOLUNTARY</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Cluster Resign *</label>
                                    <select
                                        value={formData.cluster_resign}
                                        onChange={(e) => setFormData({ ...formData, cluster_resign: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                                    >
                                        {filterOptions.clusters?.map(cl => (
                                            <option key={cl} value={cl}>{cl}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Status Alumni *</label>
                                    <select
                                        value={formData.alumni}
                                        onChange={(e) => setFormData({ ...formData, alumni: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                                    >
                                        <option value="Alumni">Alumni</option>
                                        <option value="Non Alumni">Non Alumni</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Keterangan Program / Rekrutmen</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Asisten Kebun - I/2021, Rekrut Eksternal"
                                    value={formData.keterangan}
                                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">Alasan / Catatan Exit Interview</label>
                                <textarea
                                    rows={3}
                                    placeholder="Penjelasan rinci penyebab resign..."
                                    value={formData.deskripsi_resign}
                                    onChange={(e) => setFormData({ ...formData, deskripsi_resign: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="bg-slate-50/80 -mx-5 -mb-5 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2.5 mt-4 rounded-b-2xl">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setEditItem(null);
                                    }}
                                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs transition-all shadow-2xs cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 bg-[#004D40] hover:bg-[#00382e] text-white font-bold rounded-xl shadow-xs text-xs transition-all cursor-pointer disabled:opacity-60"
                                >
                                    {isSubmitting ? 'Menyimpan...' : (editItem ? 'Simpan Perubahan' : 'Tambah Karyawan')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: DELETE CONFIRMATION */}
            {deleteItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-gray-200 p-5 space-y-4 animate-scaleIn text-center">
                        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-sm text-gray-900">
                                Konfirmasi Hapus Data
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Apakah Anda yakin ingin menghapus data resign atas nama <b className="text-gray-800">{deleteItem.nama}</b>? Tindakan ini tidak dapat dibatalkan.
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-2">
                            <button
                                onClick={() => setDeleteItem(null)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDeleteSubmit}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-60"
                            >
                                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: IMPORT EXCEL / CSV */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-scaleIn my-8">
                        {/* Header Modern Clean White */}
                        <div className="px-6 py-4.5 bg-white border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#004D40] border border-emerald-100/80 flex items-center justify-center shrink-0">
                                    <UploadCloud size={20} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                                        Import Data Karyawan Resign
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Unggah file Excel (.xlsx, .xls) atau CSV untuk input massal
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    if (!isUploading) {
                                        setIsImportModalOpen(false);
                                        setImportFile(null);
                                    }
                                }}
                                disabled={isUploading}
                                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                                title="Tutup"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleImportSubmit} className="p-6 space-y-5">
                            {/* Step 1: Download Official Template */}
                            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                            <FileSpreadsheet size={15} className="text-[#004D40]" />
                                            <span>Format &amp; Template Resmi</span>
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Unduh template yang sudah terstandar format kolom dan contohnya:
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <a
                                            href="/resign/template?format=xlsx"
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 border border-gray-300 hover:border-emerald-500 rounded-xl text-xs font-bold transition-all shadow-2xs group cursor-pointer"
                                            download
                                            title="Unduh Template Format Excel (.xlsx)"
                                        >
                                            <FileSpreadsheet size={15} className="text-emerald-700 transition-transform group-hover:scale-110" />
                                            <span>Template Excel (.xlsx)</span>
                                        </a>
                                        <a
                                            href="/resign/template?format=csv"
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 hover:text-slate-900 border border-gray-300 hover:border-slate-400 rounded-xl text-xs font-bold transition-all shadow-2xs group cursor-pointer"
                                            download
                                            title="Unduh Template Format CSV (.csv)"
                                        >
                                            <FileSpreadsheet size={15} className="text-slate-600 transition-transform group-hover:scale-110" />
                                            <span>Template CSV (.csv)</span>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: File Upload Dropzone */}
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-2">
                                    Pilih File Dokumen (.xlsx, .xls, .csv) <span className="text-rose-500">*</span>
                                </label>
                                
                                <div 
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDragging(false);
                                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                            setImportFile(e.dataTransfer.files[0]);
                                        }
                                    }}
                                    className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                                        isDragging 
                                            ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]' 
                                            : importFile 
                                                ? 'border-emerald-400 bg-emerald-50/20' 
                                                : 'border-slate-300 hover:border-emerald-400 bg-slate-50/40 hover:bg-slate-50'
                                    }`}
                                >
                                    <input 
                                        type="file" 
                                        id="resign-file-input"
                                        accept=".xlsx,.xls,.csv,.txt"
                                        className="hidden" 
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setImportFile(e.target.files[0]);
                                            }
                                        }}
                                    />

                                    {importFile ? (
                                        <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs text-left">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2.5 bg-emerald-100/70 text-[#004D40] rounded-xl shrink-0">
                                                    <FileSpreadsheet size={22} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-bold text-slate-900 truncate">
                                                        {importFile.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                        {(importFile.size / 1024).toFixed(1)} KB · Siap diimpor
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setImportFile(null)}
                                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                                                title="Ganti File"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label htmlFor="resign-file-input" className="cursor-pointer block py-2">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#004D40] flex items-center justify-center mx-auto mb-3">
                                                <UploadCloud size={24} />
                                            </div>
                                            <p className="text-xs font-bold text-slate-800">
                                                Tarik &amp; letakkan file di sini, atau <span className="text-[#004D40] underline font-extrabold">telusuri file</span>
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-1">
                                                Mendukung format Microsoft Excel (.xlsx, .xls) dan CSV (Maks. 10MB)
                                            </p>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Step 3: Mode Import */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-800">
                                    Metode Penggabungan Data:
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <label className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                        importMode === 'append'
                                            ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-400/50'
                                            : 'bg-white border-slate-200 hover:bg-slate-50'
                                    }`}>
                                        <input 
                                            type="radio" 
                                            name="import_mode" 
                                            value="append" 
                                            checked={importMode === 'append'}
                                            onChange={() => setImportMode('append')}
                                            className="mt-0.5 text-[#004D40] focus:ring-emerald-500 cursor-pointer" 
                                        />
                                        <div>
                                            <p className="font-bold text-slate-900">Append / Perbarui (Aman)</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                                                Tambah data baru, dan perbarui data jika NIK/Nama &amp; Tgl Resign sama.
                                            </p>
                                        </div>
                                    </label>

                                    <label className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                        importMode === 'replace'
                                            ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-400/50'
                                            : 'bg-white border-slate-200 hover:bg-slate-50'
                                    }`}>
                                        <input 
                                            type="radio" 
                                            name="import_mode" 
                                            value="replace" 
                                            checked={importMode === 'replace'}
                                            onChange={() => setImportMode('replace')}
                                            className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer" 
                                        />
                                        <div>
                                            <p className="font-bold text-slate-900">Ganti Semua (Replace)</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                                                Kosongkan semua data lama dan gantikan dengan isi file ini.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Help Box */}
                            <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
                                <p className="font-bold flex items-center gap-1.5 text-amber-800">
                                    <AlertCircle size={13} className="shrink-0" />
                                    <span>Petunjuk Format Kolom:</span>
                                </p>
                                <p className="text-amber-800 leading-relaxed text-[11px]">
                                    • Format Tanggal: <code className="font-mono font-bold bg-amber-100/70 px-1 rounded">YYYY-MM-DD</code> atau <code className="font-mono font-bold bg-amber-100/70 px-1 rounded">DD/MM/YYYY</code>.<br />
                                    • Region: <span className="font-semibold">Riau</span>, <span className="font-semibold">Kalbar</span>, atau <span className="font-semibold">Kaltim</span> (Kubar otomatis diarahkan ke Kaltim).<br />
                                    • Jenis Resign: <span className="font-semibold">VOLUNTARY</span> atau <span className="font-semibold">INVOLUNTARY</span>.
                                </p>
                            </div>

                            {/* Footer Actions */}
                            <div className="bg-slate-50/80 -mx-6 -mb-6 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2.5 rounded-b-2xl">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsImportModalOpen(false);
                                        setImportFile(null);
                                    }}
                                    disabled={isUploading}
                                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={!importFile || isUploading}
                                    className="inline-flex items-center gap-2 px-5 py-2 bg-[#004D40] hover:bg-[#00382e] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 transition-all"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Mengimpor Data...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud size={14} />
                                            <span>Mulai Proses Import</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
