import { Link, usePage } from '@inertiajs/react';
import { 
    LogOut, 
    LayoutDashboard, 
    Map as MapIcon, 
    Users, 
    Clock, 
    UserMinus, 
    GraduationCap, 
    Link2, 
    Contact, 
    Settings, 
    Database, 
    MapPin, 
    UploadCloud,
    Menu,
    ChevronLeft,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useState } from 'react';

export default function AppLayout({ children, fullHeight = false, title = '' }) {
    const { auth } = usePage().props;
    const [collapsed, setCollapsed] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const currentUrl = usePage().url;

    // Helper untuk menu item top level (tanpa children)
    const NavItem = ({ href, icon: Icon, label }) => {
        const active = currentUrl === href || currentUrl.startsWith(href + '/') || currentUrl.startsWith(href + '?');
        return (
            <Link 
                href={href} 
                className={`flex items-center justify-between px-4 py-2.5 mx-2 rounded-lg transition-colors group
                    ${active ? 'text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-900 font-medium'}`}
                title={collapsed ? label : undefined}
            >
                <div className="flex items-center gap-3">
                    <Icon size={18} strokeWidth={2} className={active ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'} />
                    {!collapsed && <span className="text-[13px]">{label}</span>}
                </div>
            </Link>
        );
    };

    // Helper untuk menu sub-item
    const SubItem = ({ href, label }) => {
        const active = currentUrl === href || currentUrl.startsWith(href + '/') || currentUrl.startsWith(href + '?');
        return (
            <Link 
                href={href} 
                className={`flex items-center px-4 py-2 mx-2 mb-1 rounded-full transition-colors group
                    ${active ? 'bg-stone-100 text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-900 font-medium'}`}
            >
                <div className="flex items-center pl-9">
                    <span className="text-[13px]">{label}</span>
                </div>
            </Link>
        );
    };

    // Helper untuk group menu
    const NavGroup = ({ icon: Icon, label, children, activeUrls = [] }) => {
        const isActive = activeUrls.some(url => currentUrl.startsWith(url));
        const [isOpen, setIsOpen] = useState(isActive);

        if (collapsed) {
            return (
                <div className="group relative">
                    <div className={`flex items-center justify-center px-4 py-2.5 mx-2 rounded-lg transition-colors cursor-pointer
                        ${isActive ? 'text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-900 font-medium'}`}
                    >
                        <Icon size={18} strokeWidth={2} className={isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'} />
                    </div>
                </div>
            );
        }

        return (
            <div>
                <div 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center justify-between px-4 py-2.5 mx-2 rounded-lg transition-colors cursor-pointer group
                        ${isActive ? 'text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-900 font-medium'}`}
                >
                    <div className="flex items-center gap-3">
                        <Icon size={18} strokeWidth={2} className={isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'} />
                        <span className="text-[13px]">{label}</span>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
                {isOpen && (
                    <div className="mt-1">
                        {children}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-app-bg flex font-sans text-gray-800">
            {/* Sidebar */}
            <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-100 flex flex-col transition-all duration-300 z-20 shrink-0`}>
                <div className="h-20 flex items-center justify-between px-4 shrink-0 relative bg-white">
                    {!collapsed && (
                        <div className="flex items-center gap-3 px-2 w-full">
                            <img src="/logofr.png" alt="Logo" className="h-9 w-auto object-contain" />
                            <span className="font-semibold text-gray-800 text-[1.1rem] tracking-normal">Peta SDM</span>
                        </div>
                    )}
                    {collapsed && (
                        <div className="mx-auto flex items-center justify-center">
                            <img src="/logofr.png" alt="Logo" className="h-9 w-9 object-contain" />
                        </div>
                    )}
                    
                    <button 
                        onClick={() => setCollapsed(!collapsed)} 
                        className={`absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 text-gray-400 hover:text-gray-800 shadow-sm z-10 ${collapsed ? 'hidden' : 'block'}`}
                    >
                        <ChevronLeft size={14} />
                    </button>
                    {collapsed && (
                        <button onClick={() => setCollapsed(false)} className="absolute inset-0 w-full h-full cursor-pointer opacity-0"></button>
                    )}
                </div>

                {!collapsed && (
                    <div className="px-5 mb-4 mt-2 pb-4 border-b border-gray-100 border-dashed">
                        <Link href="/admin/import" className="flex items-center justify-between bg-[#F85628] hover:bg-[#E5481B] text-white px-4 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-sm">
                            <div className="flex items-center gap-2">
                                <span className="font-normal text-lg leading-none">+</span>
                                <span>Import Data</span>
                            </div>
                            <ChevronDown size={16} className="opacity-80" />
                        </Link>
                    </div>
                )}
                {collapsed && (
                    <div className="px-3 mb-4 mt-2 pb-4 flex justify-center border-b border-gray-100 border-dashed">
                        <Link href="/admin/import" className="bg-[#F85628] hover:bg-[#E5481B] text-white p-2.5 rounded-full transition-colors shadow-sm">
                            <span className="font-bold text-lg leading-none">+</span>
                        </Link>
                    </div>
                )}
                
                <div className="flex-1 overflow-y-auto py-2 space-y-1" style={{ scrollbarWidth: 'none' }}>
                    <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem href="/peta" icon={MapIcon} label="Peta Perusahaan" />
                    
                    <NavGroup icon={Users} label="Analitik SDM" activeUrls={['/demografi', '/masa-kerja', '/pensiun', '/pelatihan', '/pelatihan/data', '/analisis-gabungan']}>
                        <SubItem href="/demografi" label="Demografi" />
                        <SubItem href="/masa-kerja" label="Masa Kerja" />
                        <SubItem href="/pensiun" label="Risiko Pensiun" />
                        <SubItem href="/pelatihan" label="Pelatihan" />
                        <SubItem href="/pelatihan/data" label="Data Training Mentah" />
                        <SubItem href="/analisis-gabungan" label="Analisis Gabungan" />
                    </NavGroup>

                    <NavGroup icon={Contact} label="Karyawan" activeUrls={['/karyawan']}>
                        <SubItem href="/karyawan" label="Direktori" />
                    </NavGroup>

                    <NavGroup icon={Settings} label="Sistem" activeUrls={['/admin/lokasi', '/admin/kualitas-data']}>
                        <SubItem href="/admin/lokasi" label="Master Lokasi" />
                        <SubItem href="/admin/kualitas-data" label="Kualitas Data" />
                    </NavGroup>
                </div>

                <div className="p-3 border-t border-gray-100 shrink-0 bg-white">
                    <Link href="/logout" method="post" as="button" className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors font-medium ${collapsed ? 'justify-center' : ''}`}>
                        <LogOut size={18} className={collapsed ? '' : 'ml-1'} />
                        {!collapsed && <span className="text-[13px]">Keluar Aplikasi</span>}
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 lg:px-8 shrink-0 shadow-sm relative z-10">
                    <div className="flex items-center gap-4">
                        {collapsed && (
                            <button onClick={() => setCollapsed(false)} className="lg:hidden text-gray-500 p-2 hover:bg-gray-100 rounded-md">
                                <Menu size={20} />
                            </button>
                        )}
                        {title && (
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-corporate-dark">{title}</h1>
                            </div>
                        )}
                        {!title && (
                            <h1 className="text-xl font-bold text-corporate-dark">Dashboard</h1>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-gray-900">{auth?.user?.name || 'Administrator'}</p>
                            <p className="text-xs text-corporate-dark opacity-80 font-medium tracking-wide">Peta SDM Operasional</p>
                        </div>
                        <div className="relative">
                            <button 
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="focus:outline-none flex items-center"
                            >
                                <div className="w-10 h-10 rounded-full bg-corporate-dark text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white hover:ring-corporate-light transition-all">
                                    {auth?.user?.name?.charAt(0) || 'A'}
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            </button>
                            
                            {dropdownOpen && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-40" 
                                        onClick={() => setDropdownOpen(false)}
                                    ></div>
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 border border-gray-100 z-50 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-100">
                                        <Link 
                                            href="/pengaturan"
                                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <Settings size={16} className="text-gray-400" />
                                            Pengaturan Akun
                                        </Link>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <Link 
                                            href="/logout"
                                            method="post" 
                                            as="button" 
                                            className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <LogOut size={16} className="text-red-500" />
                                            Keluar
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className={`flex-1 ${fullHeight ? 'relative overflow-hidden' : 'p-6 lg:p-8 overflow-auto'}`}>
                    {children}
                </main>
            </div>
        </div>
    );
}
