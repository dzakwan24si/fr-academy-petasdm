import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatNumber } from '@/lib/format';
import { Maximize2, X } from 'lucide-react';

export function Heatmap({ 
    data, 
    xLabels = [], 
    yLabels = [], 
    valueKey = 'value', 
    tooltipKey = 'label',
    title = 'Heatmap',
    yTitle = 'Region',
    expandable = 'auto' 
}) {
    if (!data || data.length === 0 || !xLabels.length || !yLabels.length) return null;

    const [modalOpen, setModalOpen] = useState(false);
    const shouldShowExpand = expandable === true || (expandable === 'auto' && xLabels.length > 6);

    // Escape key listener to close modal
    useEffect(() => {
        if (!modalOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setModalOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        
        // Lock body scroll
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = originalOverflow;
        };
    }, [modalOpen]);

    // Menemukan nilai maksimal untuk menentukan intensitas warna
    const maxValue = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1);

    // Palet warna dari abu-abu (0) ke hijau muda hingga hijau tua korporat (#004D40)
    const getColor = (value) => {
        if (!value || value <= 0) return '#F3F4F6'; // gray-100 for empty
        const intensity = value / maxValue;
        if (intensity > 0.8) return '#004D40'; // corporate-dark
        if (intensity > 0.6) return '#00695C';
        if (intensity > 0.4) return '#2E7D32'; // corporate-light
        if (intensity > 0.2) return '#4CAF50';
        return '#A5D6A7'; // lightest green
    };

    const getTextColor = (value) => {
        if (!value || value <= 0) return '#9CA3AF';
        const intensity = value / maxValue;
        return intensity > 0.4 ? '#FFFFFF' : '#1F2937';
    };

    // Render Matrix Content (used both in card and modal)
    const renderMatrix = (isModal = false) => {
        const cellWidthClass = isModal ? 'w-16 sm:w-20' : 'w-14 sm:w-16';
        const cellHeightClass = isModal ? 'h-11' : 'h-9';
        const labelWidthClass = isModal ? 'w-28 sm:w-36' : 'w-24 sm:w-28';
        const fontSizeClass = isModal ? 'text-xs sm:text-sm' : 'text-xs';

        return (
            <div className={`w-full overflow-auto ${isModal ? 'max-h-[66vh]' : 'max-h-[340px]'}`} style={{ scrollbarWidth: 'thin' }}>
                <div className="min-w-max pb-2">
                    {/* Header Row (Years) */}
                    <div className="flex sticky top-0 bg-white z-20 pb-1.5 pt-1 border-b border-gray-200">
                        {/* Pinned Top-Left Corner (Row Header) */}
                        <div className={`${labelWidthClass} shrink-0 sticky left-0 bg-white z-30 font-bold text-gray-500 text-[11px] uppercase tracking-wider flex items-center justify-end pr-3 border-r border-gray-200`}>
                            <span>{yTitle}</span>
                        </div>
                        {xLabels.map(x => (
                            <div key={x} className={`${cellWidthClass} shrink-0 text-center py-1.5 font-bold text-gray-700 ${fontSizeClass} truncate px-0.5`} title={String(x)}>
                                {x}
                            </div>
                        ))}
                    </div>

                    {/* Data Rows (Regions) */}
                    <div className="pt-1.5 space-y-1">
                        {yLabels.map(y => (
                            <div key={y} className="flex items-center group">
                                {/* Pinned Left Column (Region Name) */}
                                <div 
                                    className={`${labelWidthClass} shrink-0 text-right pr-3 py-2 font-bold text-gray-800 truncate sticky left-0 bg-white z-10 border-r border-gray-200 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] ${fontSizeClass}`} 
                                    title={y}
                                >
                                    {y}
                                </div>
                                {xLabels.map(x => {
                                    const cell = data.find(d => d.x === x && d.y === y);
                                    const val = cell ? cell[valueKey] : 0;
                                    const label = cell ? cell[tooltipKey] : '';

                                    return (
                                        <div 
                                            key={`${x}-${y}`} 
                                            className={`${cellWidthClass} ${cellHeightClass} shrink-0 flex items-center justify-center p-1 mx-[1px] rounded-lg transition-all hover:scale-105 hover:z-20 cursor-default select-none font-semibold ${fontSizeClass} shadow-2xs hover:shadow-md`}
                                            style={{ backgroundColor: getColor(val), color: getTextColor(val) }}
                                            title={`${y} — Tahun ${x}\n${label || 'Jumlah Rekrutmen'}: ${formatNumber(val)} orang`}
                                        >
                                            {val > 0 ? formatNumber(val) : '-'}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full flex flex-col">
            {/* Inline Card View */}
            {renderMatrix(false)}

            {/* Expand / Enlarge Button Below Chart */}
            {shouldShowExpand && (
                <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="mt-3.5 w-full py-2.5 px-4 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
                >
                    <Maximize2 size={14} className="text-emerald-700 group-hover:scale-110 transition-transform" />
                    <span>Perbesar Tampilan Heatmap (Layar Penuh)</span>
                </button>
            )}

            {/* Fullscreen Modal View */}
            {modalOpen && typeof document !== 'undefined' && createPortal(
                <div 
                    className="fixed inset-0 bg-gray-900/60 backdrop-blur-2xs z-[9999] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setModalOpen(false);
                    }}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-slate-50/70">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                                    <span>{title}</span>
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Geser secara horizontal untuk melihat seluruh rentang data. Nama {yTitle.toLowerCase()} tetap terkunci di sebelah kiri.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors cursor-pointer"
                                title="Tutup (Esc)"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Color Scale Legend */}
                        <div className="px-6 py-2.5 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
                            <span className="text-gray-500 font-medium">Intensitas Rekrutmen:</span>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded bg-gray-100 border border-gray-200 inline-block"></span>
                                    <span className="text-gray-600">0 (Nol)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded bg-[#A5D6A7] inline-block"></span>
                                    <span className="text-gray-600">Rendah</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded bg-[#4CAF50] inline-block"></span>
                                    <span className="text-gray-600">Sedang</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded bg-[#004D40] inline-block"></span>
                                    <span className="text-gray-600">Tinggi (Puncak)</span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Matrix Body */}
                        <div className="p-4 sm:p-6 flex-1 overflow-hidden flex flex-col">
                            {renderMatrix(true)}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between bg-slate-50/50 shrink-0 text-xs">
                            <div className="text-gray-500 font-medium flex items-center gap-4">
                                <span>Total Tahun: <strong className="text-gray-800">{xLabels.length}</strong></span>
                                <span>Total Region: <strong className="text-gray-800">{yLabels.length}</strong></span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl font-semibold transition-colors cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
