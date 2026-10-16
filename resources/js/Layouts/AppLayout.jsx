import { Link, usePage } from '@inertiajs/react';
import { 
    LogOut, 
    LayoutDashboard, 
    Building2, 
    Users, 
    Clock, 
    UserMinus, 
    GraduationCap, 
    Link2, 
    Contact, 
    Settings, 
    Database, 
    UploadCloud,
    Menu,
    ChevronLeft,
    ChevronRight,
    X,
    ShieldCheck,
    FileSpreadsheet,
    Activity,
    Layers,
    UserCheck,
    UserCog
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AppLayout({ children, fullHeight = false, title = '' }) {
    const { auth } = usePage().props;
    const canImport = auth?.user?.can_import ?? false;
    const canManageUsers = auth?.user?.can_manage_users ?? false;
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const currentUrl = usePage().url;

    // Tutup mobile drawer saat berpindah halaman
    useEffect(() => {
        setMobileOpen(false);
    }, [currentUrl]);

    // Helper breadcrumb untuk header
    const getBreadcrumb = () => {
        if (currentUrl.startsWith('/dashboard')) return { section: 'Utama', page: 'Dashboard' };
        if (currentUrl.startsWith('/karyawan')) return { section: 'Data & Sistem', page: 'Direktori Karyawan' };
        if (currentUrl.startsWith('/perusahaan')) return { section: 'Analitik SDM', page: 'Perusahaan' };
        if (currentUrl.startsWith('/demografi')) return { section: 'Analitik SDM', page: 'Demografi' };
        if (currentUrl.startsWith('/masa-kerja')) return { section: 'Analitik SDM', page: 'Masa Kerja' };
        if (currentUrl.startsWith('/pensiun')) return { section: 'Analitik SDM', page: 'Risiko Pensiun' };
        if (currentUrl.startsWith('/pelatihan/data')) return { section: 'Data & Sistem', page: 'Data Training Mentah' };
        if (currentUrl.startsWith('/pelatihan')) return { section: 'Analitik SDM', page: 'Pelatihan' };
        if (currentUrl.startsWith('/analisis-gabungan')) return { section: 'Analitik SDM', page: 'Analisis Gabungan' };
        if (currentUrl.startsWith('/admin/kualitas-data')) return { section: 'Data & Sistem', page: 'Kualitas Data' };
        if (currentUrl.startsWith('/admin/import')) return { section: 'Data & Sistem', page: 'Import & Sinkronisasi' };
        if (currentUrl.startsWith('/admin/users')) return { section: 'Admin', page: 'Manajemen Akun' };
        if (currentUrl.startsWith('/pengaturan')) return { section: 'Pengaturan', page: 'Pengaturan Akun' };
        return { section: 'Peta SDM', page: title || 'Aplikasi' };
    };

    const breadcrumb = getBreadcrumb();

    // NavItem yang modern dengan bentuk kapsul lengkung (rounded-full)
    const NavItem = ({ href, icon: Icon, label, exact = false }) => {
        const active = exact 
            ? currentUrl === href || currentUrl === href + '/'
            : currentUrl === href || currentUrl.startsWith(href + '/') || currentUrl.startsWith(href + '?');

        return (
            <Link 
                href={href} 
                onClick={() => setMobileOpen(false)}
                className={`flex items-center transition-all duration-200 group relative z-10
                    ${collapsed 
                        ? 'lg:justify-center lg:w-10 lg:h-10 lg:mx-auto justify-between px-4 py-2.5 mx-3 rounded-full my-0.5' 
                        : 'justify-between px-4 py-2.5 mx-3 rounded-full my-0.5'
                    }
                    ${active 
                        ? 'bg-white text-[#004D40] font-bold shadow-[0_4px_16px_rgba(0,0,0,0.16)]' 
                        : 'text-green-100/75 hover:text-white font-medium hover:bg-white/10'
                    }`}
                title={collapsed ? label : undefined}
            >
                <div className={`flex items-center gap-3 ${collapsed ? 'lg:justify-center' : ''}`}>
                    <Icon 
                        size={18} 
                        strokeWidth={active ? 2.4 : 1.8} 
                        className={`shrink-0 transition-colors ${
                            active ? 'text-[#004D40]' : 'text-green-100/70 group-hover:text-white'
                        }`} 
                    />
                    <span className={`text-[13px] tracking-wide ${collapsed ? 'block lg:hidden' : 'block'}`}>{label}</span>
                </div>
                {active && (
                    <span className={`w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 shadow-xs ${collapsed ? 'block lg:hidden' : 'block'}`} />
                )}
            </Link>
        );
    };

    const SectionLabel = ({ label }) => {
        if (collapsed) {
            return (
                <>
                    <div className="hidden lg:block h-2 my-1 border-t border-white/5" />
                    <div className="lg:hidden px-5 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-green-200/40 select-none">
                        {label}
                    </div>
                </>
            );
        }
        return (
            <div className="px-5 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-green-200/40 select-none">
                {label}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-gray-800 antialiased selection:bg-emerald-600 selection:text-white">
            {/* Mobile Backdrop Overlay */}
            {mobileOpen && (
                <div 
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-2xs z-40 lg:hidden transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside 
                className={`
                    fixed inset-y-0 left-0 z-50 lg:static lg:z-20
                    w-72 max-w-[85vw] ${collapsed ? 'lg:w-20' : 'lg:w-64'} 
                    bg-[#004D40] border-r border-[#00382e] flex flex-col transition-all duration-300 shrink-0
                    rounded-r-3xl lg:rounded-none shadow-2xl lg:shadow-none
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                {/* Sidebar Header / Logo */}
                <div className="h-16 flex items-center justify-between px-4 shrink-0 relative z-10 border-b border-white/10">
                    <div className={`flex items-center gap-3 px-1 w-full ${collapsed ? 'lg:hidden' : 'flex'}`}>
                        <div className="bg-white p-2 rounded-2xl shadow-xs flex items-center justify-center shrink-0">
                            <img src="/logofr.png" alt="Logo" className="h-8.5 w-auto object-contain" />
                        </div>
                        <div className="min-w-0">
                            <span className="font-extrabold text-white text-base tracking-tight block leading-tight">Peta SDM</span>
                            <span className="text-[10px] text-emerald-200/90 font-bold tracking-wider uppercase block mt-0.5">Operasional FR</span>
                        </div>
                    </div>
                    {collapsed && (
                        <div className="hidden lg:flex mx-auto items-center justify-center">
                            <div className="bg-white p-2 rounded-2xl shadow-xs">
                                <img src="/logofr.png" alt="Logo" className="h-8 w-auto object-contain" />
                            </div>
                        </div>
                    )}
                    
                    {/* Desktop Collapse Button */}
                    <button 
                        onClick={() => setCollapsed(!collapsed)} 
                        className={`hidden lg:flex items-center justify-center absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full w-6 h-6 text-gray-500 hover:text-emerald-900 shadow-sm z-30 transition-transform ${collapsed ? 'rotate-180' : ''}`}
                        title={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
                    >
                        <ChevronLeft size={13} />
                    </button>

                    {/* Mobile Close Button */}
                    <button 
                        onClick={() => setMobileOpen(false)} 
                        className="lg:hidden text-green-100/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                        title="Tutup Navigasi"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto py-3 space-y-0.5 relative z-10" style={{ scrollbarWidth: 'none' }}>
                    <SectionLabel label="Utama" />
                    <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" exact={true} />

                    <SectionLabel label="Analitik SDM" />
                    <NavItem href="/demografi" icon={Users} label="Demografi" />
                    <NavItem href="/perusahaan" icon={Building2} label="Perusahaan" />
                    <NavItem href="/masa-kerja" icon={Clock} label="Masa Kerja" />
                    <NavItem href="/pensiun" icon={UserMinus} label="Risiko Pensiun" />
                    <NavItem href="/pelatihan" icon={GraduationCap} label="Pelatihan" exact={true} />
                    <NavItem href="/analisis-gabungan" icon={Link2} label="Analisis Gabungan" />

                    <SectionLabel label="Data & Sistem" />
                    <NavItem href="/karyawan" icon={Contact} label="Direktori Karyawan" />
                    <NavItem href="/pelatihan/data" icon={FileSpreadsheet} label="Data Training Mentah" />
                    <NavItem href="/admin/kualitas-data" icon={ShieldCheck} label="Kualitas Data" />
                    {canImport && <NavItem href="/admin/import" icon={UploadCloud} label="Import & Sinkronisasi" />}
                    {canManageUsers && <NavItem href="/admin/users" icon={UserCog} label="Manajemen Akun" />}
                </div>

                {/* Sidebar Footer / User Profile & Logout */}
                <div className="p-3 border-t border-white/10 shrink-0 relative z-10 bg-[#004237]/60">
                    <Link 
                        href="/logout" 
                        method="post" 
                        as="button" 
                        className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-full text-green-100/80 hover:text-white hover:bg-rose-500/25 border border-white/5 hover:border-rose-400/30 transition-all font-semibold text-xs ${collapsed ? 'justify-center px-0 w-10 h-10 mx-auto' : ''}`}
                        title="Keluar Aplikasi"
                    >
                        <LogOut size={16} className="text-green-100/70 shrink-0" />
                        {!collapsed && <span>Keluar Aplikasi</span>}
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Header Topbar */}
                <header className="h-16 bg-white/95 backdrop-blur-xs border-b border-gray-200/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 shadow-2xs relative z-30">
                    <div className="flex items-center gap-3.5">
                        {/* Mobile Menu Button */}
                        <button 
                            onClick={() => setMobileOpen(true)} 
                            className="lg:hidden text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                            title="Buka Navigasi"
                        >
                            <Menu size={20} />
                        </button>

                        {/* Breadcrumbs Navigation */}
                        <div className="flex items-center gap-2.5">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:inline">
                                {breadcrumb.section}
                            </span>
                            <span className="text-gray-300 font-normal hidden sm:inline">/</span>
                            <span className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                                {breadcrumb.page}
                            </span>
                        </div>
                    </div>
                    
                    {/* Header Right Tools */}
                    <div className="flex items-center gap-4">

                        {/* User Profile Info */}
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-gray-900 leading-tight">{auth?.user?.name || 'Administrator'}</p>
                            <p className="text-[10px] text-gray-400 font-mono font-medium leading-tight mt-0.5">
                                {auth?.user?.nik ? `NIK: ${auth.user.nik}` : '-'}
                            </p>
                            {(auth?.user?.job_title || auth?.user?.employee?.job_title_name) && (
                                <p className="text-[10px] text-gray-500 font-medium leading-tight truncate max-w-[180px]" title={auth.user.job_title || auth.user.employee?.job_title_name}>
                                    {auth.user.job_title || auth.user.employee?.job_title_name}
                                </p>
                            )}
                        </div>

                        {/* User Profile Avatar & Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="focus:outline-none flex items-center cursor-pointer group"
                            >
                                <div className="w-9 h-9 rounded-full bg-[#004D40] text-white flex items-center justify-center font-bold text-sm shadow-2xs ring-2 ring-emerald-100 group-hover:ring-emerald-300 transition-all">
                                    {auth?.user?.name?.charAt(0) || 'A'}
                                </div>
                            </button>
                            
                            {dropdownOpen && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-40" 
                                        onClick={() => setDropdownOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl py-1.5 border border-gray-100 z-50 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-100">
                                        <div className="px-4 py-2.5 border-b border-gray-100">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold text-gray-900 truncate max-w-[130px]">{auth?.user?.name || 'Administrator'}</p>
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                    auth?.user?.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                                                    auth?.user?.role === 'manajemen' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-sky-100 text-sky-700'
                                                }`}>
                                                    {auth?.user?.role || 'Viewer'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
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
                                                className="px-4 py-2 text-xs text-purple-700 hover:bg-purple-50 flex items-center gap-2.5 font-bold transition-colors"
                                            >
                                                <UserCog size={15} className="text-purple-600" />
                                                Manajemen Akun
                                            </Link>
                                        )}

                                        <Link 
                                            href="/pengaturan"
                                            className="px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 font-medium transition-colors"
                                        >
                                            <Settings size={15} className="text-gray-400" />
                                            Pengaturan Akun
                                        </Link>
                                        
                                        <div className="border-t border-gray-100 my-1" />
                                        
                                        <Link 
                                            href="/logout"
                                            method="post" 
                                            as="button" 
                                            className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-semibold transition-colors"
                                        >
                                            <LogOut size={15} className="text-rose-500" />
                                            Keluar Aplikasi
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content Body */}
                <main className={`flex-1 ${fullHeight ? 'relative overflow-hidden' : 'p-3.5 sm:p-5 lg:p-6 overflow-auto'}`}>
                    <div className={fullHeight ? 'w-full h-full' : 'max-w-7xl mx-auto'}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
