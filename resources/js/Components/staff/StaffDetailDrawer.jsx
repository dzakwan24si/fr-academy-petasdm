import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User } from 'lucide-react';
import StaffDetailPane from '@/Components/staff/StaffDetailPane';

export default function StaffDetailDrawer({ employeeId, onClose }) {
    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        const originalStyle = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    if (!employeeId || typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[99998] flex justify-end">
            {/* Backdrop Overlay */}
            <div 
                className="fixed inset-0 bg-slate-900/35 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200 cursor-pointer"
                onClick={onClose}
                aria-label="Tutup panel"
            />

            {/* Slide-over Drawer Panel */}
            <aside 
                className="relative z-[99999] w-full max-w-2xl lg:max-w-3xl h-full bg-[#F8FAF9] shadow-2xl flex flex-col border-l border-gray-200/90 transform transition-all animate-in slide-in-from-right duration-300 ease-out"
                role="dialog"
                aria-modal="true"
                aria-label="Detail Profil Karyawan"
            >
                {/* Drawer Sticky Header */}
                <header className="bg-white/95 backdrop-blur-md px-5 sm:px-6 py-3.5 border-b border-gray-200/80 flex items-center justify-between sticky top-0 z-20 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#004D40] flex items-center justify-center shrink-0 border border-emerald-100">
                            <User size={16} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate">
                                Profil Lengkap Karyawan
                            </h3>
                            <p className="text-[11px] text-slate-500 truncate">
                                Penempatan, demografi, dan riwayat pelatihan
                            </p>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer shrink-0"
                        title="Tutup Panel (Esc)"
                    >
                        <X size={14} />
                        <span>Tutup</span>
                        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-white rounded border border-slate-200 shadow-2xs">
                            Esc
                        </kbd>
                    </button>
                </header>

                {/* Drawer Scrollable Content */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
                    <StaffDetailPane employeeId={employeeId} />
                </div>
            </aside>
        </div>,
        document.body
    );
}

export { StaffDetailDrawer };
