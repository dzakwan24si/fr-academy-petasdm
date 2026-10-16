import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

export function InfoTooltip({ title, text, position = 'bottom', className = '' }) {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 280, arrowLeft: 0, placement: 'bottom' });
    const buttonRef = useRef(null);
    const tooltipRef = useRef(null);

    const updatePosition = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const tooltipWidth = Math.min(288, window.innerWidth - 32); // w-72 or screen fit
        const iconCenterX = rect.left + rect.width / 2;

        // Horizontally center tooltip under/above icon, clamped within screen margins
        let left = iconCenterX - tooltipWidth / 2;
        const margin = 12;
        if (left < margin) {
            left = margin;
        } else if (left + tooltipWidth > window.innerWidth - margin) {
            left = window.innerWidth - margin - tooltipWidth;
        }

        // Relative arrow position (clamped inside tooltip rounded corners)
        let arrowLeft = iconCenterX - left;
        arrowLeft = Math.max(16, Math.min(arrowLeft, tooltipWidth - 16));

        // Determine vertical placement: open bottom by default, or top if not enough room below
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const estimatedHeight = tooltipRef.current?.offsetHeight || 250;

        let placement = position;
        let top = 0;

        if (position === 'top' || (spaceBelow < estimatedHeight + 16 && spaceAbove > 80)) {
            placement = 'top';
            top = rect.top - 8;
        } else {
            placement = 'bottom';
            top = rect.bottom + 8;
        }

        setCoords({ top, left, width: tooltipWidth, arrowLeft, placement });
    };

    useEffect(() => {
        if (!visible) return;

        updatePosition();
        const raf = requestAnimationFrame(() => {
            updatePosition();
        });

        const handleScrollOrResize = () => {
            updatePosition();
        };

        const handleClickOutside = (e) => {
            if (
                buttonRef.current && !buttonRef.current.contains(e.target) &&
                tooltipRef.current && !tooltipRef.current.contains(e.target)
            ) {
                setVisible(false);
            }
        };

        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [visible]);

    if (!text && !title) return null;

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                className={`hide-from-export transition-colors p-0.5 rounded-full focus:outline-none focus:ring-1 focus:ring-emerald-500/30 cursor-help inline-flex items-center justify-center shrink-0 ${
                    visible 
                        ? 'text-emerald-700 bg-emerald-50' 
                        : 'text-gray-400 hover:text-emerald-700 hover:bg-emerald-50'
                } ${className}`}
                aria-label={title || 'Informasi detail data'}
                tabIndex={0}
                onMouseEnter={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
                onFocus={() => setVisible(true)}
                onBlur={() => setVisible(false)}
                onClick={(e) => { 
                    e.stopPropagation(); 
                    setVisible(prev => !prev); 
                }}
            >
                <Info size={13.5} strokeWidth={2.2} />
            </button>

            {visible && typeof document !== 'undefined' && createPortal(
                <div
                    ref={tooltipRef}
                    style={{
                        position: 'fixed',
                        top: coords.placement === 'top' ? 'auto' : `${coords.top}px`,
                        bottom: coords.placement === 'top' ? `${window.innerHeight - coords.top}px` : 'auto',
                        left: `${coords.left}px`,
                        width: `${coords.width}px`,
                        maxHeight: 'calc(100vh - 24px)',
                        zIndex: 9999,
                    }}
                    className="p-3.5 bg-white text-gray-800 text-xs rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.15)] border border-gray-200 transition-all animate-in fade-in zoom-in-95 duration-100 normal-case font-normal text-left pointer-events-auto overflow-y-auto"
                    role="tooltip"
                    onMouseEnter={() => setVisible(true)}
                    onMouseLeave={() => setVisible(false)}
                >
                    {/* Caret / Arrow */}
                    <span 
                        style={{ left: `${coords.arrowLeft}px` }}
                        className={`absolute w-2.5 h-2.5 bg-white border-gray-200 rotate-45 transform pointer-events-none -translate-x-1/2 ${
                            coords.placement === 'top' 
                                ? '-bottom-1.5 border-b border-r' 
                                : '-top-1.5 border-t border-l'
                        }`} 
                    />

                    {title && (
                        <div className="relative z-10 flex items-center gap-1.5 font-bold text-[#004D40] text-xs mb-1.5 leading-snug tracking-tight">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span>{title}</span>
                        </div>
                    )}
                    <div className="relative z-10 block text-gray-600 text-[11.5px] leading-relaxed font-normal">
                        {text}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
