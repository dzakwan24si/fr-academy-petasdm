import { Link, usePage } from '@inertiajs/react';
import { 
    LogOut, 
    LayoutDashboard, 
    Building2, 
    Contact, 
    UploadCloud,
    Menu,
    X,
    FileSpreadsheet,
    UserCog,
    TrendingDown,
    Settings,
    ChevronDown,
    Layers,
    User
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AppLayout({ children, fullHeight = false, title = '' }) {
    const { auth } = usePage().props;
    const canImport = auth?.user?.can_import ?? false;
    const canManageUsers = auth?.user?.can_manage_users ?? false;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dataMenuOpen, setDataMenuOpen] = useState(false);
    const currentUrl = usePage().url;

    // Tutup seluruh menu dropdown & mobile saat berpindah halaman
    useEffect(() => {
        setMobileOpen(false);
        setDropdownOpen(false);
        setDataMenuOpen(false);
    }, [currentUrl]);

    const isUrlActive = (href, exact = false) => {
        return exact 
            ? currentUrl === href || currentUrl === href + '/'
            : currentUrl === href || currentUrl.startsWith(href + '/') || currentUrl.startsWith(href + '?');
    };

    const isDataMasterActive = isUrlActive('/pelatihan/data') || isUrlActive('/admin/import') || isUrlActive('/admin/users');

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-800 antialiased selection:bg-emerald-600 selection:text-white">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-white border-b border-gray-200/90 shadow-2xs">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-16 flex items-center justify-between gap-4">
                        
                        {/* Left: Brand Logo & Title */}
                        <div className="flex items-center gap-4 shrink-0">
                            <Link href="/dashboard" className="flex items-center gap-3 group">
                                <img 
                                    src="/logofr.png" 
                                    alt="First Resources" 
                                    className="h-8.5 w-auto object-contain transition-transform group-hover:scale-105 duration-200" 
                                />
                                <div>
                                    <span className="font-extrabold text-slate-900 text-base tracking-tight leading-none whitespace-nowrap block">
                                        Monitoring Operation
                                    </span>
                                    <p className="text-[11px] text-gray-500 font-medium hidden 2xl:block mt-1 whitespace-nowrap">
                                        Sistem Monitoring Tenaga Kerja &amp; Operasional
                                    </p>
                                </div>
                            </Link>
                        </div>

                        {/* Center: Desktop Navigation Tabs (Horizontal) - Single-line nowrap */}
                        <nav className="hidden lg:flex items-center gap-1.5 flex-1 justify-center">
                            {/* 1. Dashboard */}
                            <Link
                                href="/dashboard"
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                                    isUrlActive('/dashboard', true)
                                        ? 'bg-[#004D40] text-white font-semibold shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <LayoutDashboard size={16} className={isUrlActive('/dashboard', true) ? 'text-emerald-200' : 'text-slate-400'} />
                                <span>Dashboard</span>
                            </Link>

                            {/* 2. Perusahaan */}
                            <Link
                                href="/perusahaan"
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                                    isUrlActive('/perusahaan')
                                        ? 'bg-[#004D40] text-white font-semibold shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <Building2 size={16} className={isUrlActive('/perusahaan') ? 'text-emerald-200' : 'text-slate-400'} />
                                <span>Perusahaan</span>
                            </Link>

                            {/* 3. Turnover & Resign */}
                            <Link
                                href="/resign"
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                                    isUrlActive('/resign')
                                        ? 'bg-[#004D40] text-white font-semibold shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <TrendingDown size={16} className={isUrlActive('/resign') ? 'text-emerald-200' : 'text-slate-400'} />
                                <span>Turnover &amp; Resign</span>
                            </Link>

                            {/* 4. Direktori Karyawan */}
                            <Link
                                href="/karyawan"
                                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                                    isUrlActive('/karyawan')
                                        ? 'bg-[#004D40] text-white font-semibold shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <Contact size={16} className={isUrlActive('/karyawan') ? 'text-emerald-200' : 'text-slate-400'} />
                                <span>Direktori Karyawan</span>
                            </Link>

                            {/* 5. Dropdown Menu Data & Master */}
                            <div className="relative shrink-0">
                                <button
                                    onClick={() => setDataMenuOpen(!dataMenuOpen)}
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                                        isDataMasterActive
                                            ? 'bg-[#004D40] text-white font-semibold shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <Layers size={16} className={isDataMasterActive ? 'text-emerald-200' : 'text-slate-400'} />
                                    <span>Data &amp; Master</span>
                                    <ChevronDown size={14} className={`transition-transform duration-150 ${isDataMasterActive ? 'text-emerald-200' : 'text-slate-400'} ${dataMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {dataMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setDataMenuOpen(false)} />
                                        <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl py-1.5 border border-gray-200/80 z-50 animate-in fade-in zoom-in-95 duration-100">
                                            <div className="px-3.5 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-gray-100">
                                                Master &amp; Konfigurasi
                                            </div>
                                            
                                            <Link
                                                href="/pelatihan/data"
                                                className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors ${
                                                    isUrlActive('/pelatihan/data') ? 'bg-emerald-50 text-[#004D40] font-bold' : 'text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                <FileSpreadsheet size={15} className="text-emerald-600" />
                                                <span>Data Pelatihan</span>
                                            </Link>

                                            {canImport && (
                                                <Link
                                                    href="/admin/import"
                                                    className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors ${
                                                        isUrlActive('/admin/import') ? 'bg-emerald-50 text-[#004D40] font-bold' : 'text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <UploadCloud size={15} className="text-emerald-600" />
                                                    <span>Import &amp; Sinkronisasi</span>
                                                </Link>
                                            )}

                                            {canManageUsers && (
                                                <Link
                                                    href="/admin/users"
                                                    className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors ${
                                                        isUrlActive('/admin/users') ? 'bg-emerald-50 text-[#004D40] font-bold' : 'text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <UserCog size={15} className="text-purple-600" />
                                                    <span>Manajemen Akun</span>
                                                </Link>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </nav>

                        {/* Right: User Profile & Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                            {/* User Info (Desktop) */}
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-slate-900 leading-tight">
                                    {auth?.user?.name || 'Administrator'}
                                </p>
                                <p className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider font-mono mt-0.5">
                                    {auth?.user?.role || 'Staff'} {auth?.user?.nik ? `· ${auth.user.nik}` : ''}
                                </p>
                            </div>

                            {/* User Avatar & Dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="focus:outline-none flex items-center cursor-pointer group"
                                    title="Menu Akun"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-[#004D40] text-white flex items-center justify-center font-bold text-sm shadow-2xs ring-2 ring-emerald-100 group-hover:ring-emerald-300 transition-all">
                                        {auth?.user?.name?.charAt(0) || 'U'}
                                    </div>
                                </button>
                                
                                {dropdownOpen && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-40" 
                                            onClick={() => setDropdownOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl py-1.5 border border-gray-200/80 z-50 origin-top-right animate-in fade-in zoom-in-95 duration-100">
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{auth?.user?.name || 'Administrator'}</p>
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                                        auth?.user?.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                                                        auth?.user?.role === 'manajemen' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-sky-100 text-sky-700'
                                                    }`}>
                                                        {auth?.user?.role || 'Viewer'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                                                    NIK: {auth?.user?.nik || '-'}
                                                </p>
                                                {auth?.user?.employee?.job_title_name && (
                                                    <p className="text-[10px] text-gray-600 font-medium mt-0.5 truncate" title={auth.user.employee.job_title_name}>
                                                        {auth.user.employee.job_title_name}
                                                    </p>
                                                )}
                                            </div>

                                            {canManageUsers && (
                                                <Link 
                                                    href="/admin/users"
                                                    className="px-4 py-2.5 text-xs text-purple-700 hover:bg-purple-50 flex items-center gap-2.5 font-semibold transition-colors"
                                                >
                                                    <UserCog size={15} className="text-purple-600" />
                                                    Manajemen Akun
                                                </Link>
                                            )}

                                            <Link 
                                                href="/pengaturan"
                                                className="px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium transition-colors"
                                            >
                                                <Settings size={15} className="text-gray-400" />
                                                Pengaturan Akun
                                            </Link>
                                            
                                            <div className="border-t border-gray-100 my-1" />
                                            
                                            <Link 
                                                href="/logout" 
                                                method="post" 
                                                as="button" 
                                                className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                                            >
                                                <LogOut size={15} className="text-rose-500" />
                                                Keluar Aplikasi
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Mobile Hamburger Toggle */}
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                title="Buka Menu"
                            >
                                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Drawer / Dropdown */}
                {mobileOpen && (
                    <div className="lg:hidden border-t border-gray-200/80 bg-white px-4 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-3 pt-1 pb-1">
                            Operasional
                        </div>
                        <Link
                            href="/dashboard"
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium ${
                                isUrlActive('/dashboard', true) ? 'bg-[#004D40] text-white font-semibold' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <LayoutDashboard size={17} />
                            <span>Dashboard</span>
                        </Link>
                        <Link
                            href="/perusahaan"
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium ${
                                isUrlActive('/perusahaan') ? 'bg-[#004D40] text-white font-semibold' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <Building2 size={17} />
                            <span>Perusahaan</span>
                        </Link>
                        <Link
                            href="/resign"
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium ${
                                isUrlActive('/resign') ? 'bg-[#004D40] text-white font-semibold' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <TrendingDown size={17} />
                            <span>Turnover &amp; Resign</span>
                        </Link>

                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-3 pt-3 pb-1 border-t border-gray-100">
                            Data &amp; Master
                        </div>
                        <Link
                            href="/karyawan"
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium ${
                                isUrlActive('/karyawan') ? 'bg-[#004D40] text-white font-semibold' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <Contact size={17} />
                            <span>Direktori Karyawan</span>
                        </Link>
                        <Link
                            href="/pelatihan/data"
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium ${
                                isUrlActive('/pelatihan/data') ? 'bg-[#004D40] text-white font-semibold' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <FileSpreadsheet size={17} />
                            <span>Data Pelatihan</span>
                        </Link>
                        {canImport && (
                            <Link
                                href="/admin/import"
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium ${
                                    isUrlActive('/admin/import') ? 'bg-[#004D40] text-white font-semibold' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <UploadCloud size={17} />
                                <span>Import &amp; Sinkronisasi</span>
                            </Link>
                        )}
                        {canManageUsers && (
                            <Link
                                href="/admin/users"
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium ${
                                    isUrlActive('/admin/users') ? 'bg-[#004D40] text-white font-semibold' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <UserCog size={17} />
                                <span>Manajemen Akun</span>
                            </Link>
                        )}
                    </div>
                )}
            </header>

            {/* Main Content Area (Full Width, Generous Breathing Room) */}
            <main className={`flex-1 ${fullHeight ? 'relative overflow-hidden' : 'p-4 sm:p-6 lg:p-8'}`}>
                <div className={fullHeight ? 'w-full h-full' : 'max-w-[1600px] mx-auto w-full'}>
                    {children}
                </div>
            </main>
        </div>
    );
}
