import { useMemo } from 'react';
import { formatNumber } from '@/lib/format';

export function RegionalMapWidget({ data, total }) {
    // data is already grouped by geo-region from the backend:
    // { 'Sumatera': { Estate: x, Mill: y, HO: z }, 'Kalimantan': ..., 'Jawa / HO': ..., 'Lainnya': ... }

    // Hardcode positions for the regions for the SVG overlay
    const regionPositions = {
        'Riau': { top: '35%', left: '20%' },
        'Kalbar': { top: '35%', left: '42%' },
        'Kubar': { top: '40%', left: '55%' },
        'Corp': { top: '70%', left: '35%' },
        'Non': { top: '70%', left: '75%' },
    };

    const displayRegions = ['Riau', 'Kalbar', 'Kubar', 'Corp', 'Non'];

    const getRegionData = (name) => {
        const d = data?.[name] || { Estate: 0, Mill: 0, HO: 0 };
        const regionTotal = (d.Estate || 0) + (d.Mill || 0) + (d.HO || 0);
        const pct = total > 0 ? Math.round((regionTotal / total) * 100) : 0;
        return { Estate: d.Estate || 0, Mill: d.Mill || 0, HO: d.HO || 0, total: regionTotal, pct };
    };

    return (
        <div className="relative w-full h-[400px] flex items-center justify-center bg-white rounded-xl overflow-hidden">
            {/* SVG representation of Indonesia map for background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                <img src="/indonesia-map.svg" alt="Peta Indonesia" className="w-[90%] h-auto opacity-15 grayscale object-contain" />
            </div>

            {displayRegions.map(region => {
                const stat = getRegionData(region);
                if (stat.total === 0) return null; // Don't show empty cards

                const pos = regionPositions[region] || { top: '50%', left: '50%' };
                
                return (
                    <div 
                        key={region} 
                        className="absolute bg-white/95 backdrop-blur shadow-sm border border-gray-100 rounded-xl p-3 flex gap-3 items-center"
                        style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)', minWidth: '160px' }}
                    >
                        <div className="w-10 h-10 rounded-full bg-corporate-dark text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-inner">
                            {stat.pct}%
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-800 text-sm mb-1">{region === 'Non' ? 'Non / Lainnya' : region}</h4>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-corporate-dark"></div> Estate</span>
                                    <span className="font-semibold text-gray-700">{formatNumber(stat.Estate)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Mill</span>
                                    <span className="font-semibold text-gray-700">{formatNumber(stat.Mill)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> HO</span>
                                    <span className="font-semibold text-gray-700">{formatNumber(stat.HO)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
