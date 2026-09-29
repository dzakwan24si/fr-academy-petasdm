import { Link, usePage } from '@inertiajs/react';
import { LogOut } from 'lucide-react';

export default function AppLayout({ children }) {
    const { auth } = usePage().props;

    return (
        <div className="min-h-screen bg-app-bg flex font-sans">
            {/* Sidebar */}
            <aside className="w-20 bg-white border-r border-gray-100 flex flex-col items-center py-6">
                <div className="w-10 h-10 bg-corporate-dark rounded-lg mb-8 text-white flex items-center justify-center font-bold">
                    P
                </div>
                <nav className="flex-1 space-y-4">
                    <Link href="/dashboard" className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${usePage().url.startsWith('/dashboard') ? 'bg-corporate-light text-white' : 'bg-gray-50 hover:bg-gray-100'}`} title="Dashboard">
                        📊
                    </Link>
                    <Link href="/demografi" className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${usePage().url.startsWith('/demografi') ? 'bg-corporate-light text-white' : 'bg-gray-50 hover:bg-gray-100'}`} title="Demografi & Headcount">
                        👥
                    </Link>
                    <Link href="/pelatihan" className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${usePage().url.startsWith('/pelatihan') ? 'bg-corporate-light text-white' : 'bg-gray-50 hover:bg-gray-100'}`} title="Pelatihan">
                        🎓
                    </Link>
                </nav>
                <Link href="/logout" method="post" as="button" className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 transition-colors">
                    <LogOut size={20} />
                </Link>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
                    <h1 className="text-xl font-semibold text-corporate-dark">Peta SDM Operasional</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{auth?.user?.name || 'Guest'}</p>

                        </div>
                        <div className="w-8 h-8 rounded-full bg-corporate-light text-white flex items-center justify-center font-bold text-sm">
                            {auth?.user?.name?.charAt(0) || 'G'}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
