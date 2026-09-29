import { formatNumber } from '@/lib/format';

export function Heatmap({ data, xLabels, yLabels, valueKey = 'value', tooltipKey = 'label' }) {
    if (!data || data.length === 0 || !xLabels || !yLabels) return null;

    // Menemukan nilai maksimal untuk menentukan intensitas warna
    const maxValue = Math.max(...data.map(d => d[valueKey] || 0));

    // Palet warna dari hijau muda ke hijau tua (corporate theme)
    const getColor = (value) => {
        if (!value) return '#F3F4F6'; // gray-100 for empty
        const intensity = value / maxValue;
        if (intensity > 0.8) return '#004D40'; // corporate-dark
        if (intensity > 0.6) return '#00695C';
        if (intensity > 0.4) return '#2E7D32'; // corporate-light
        if (intensity > 0.2) return '#4CAF50';
        return '#A5D6A7'; // lightest green
    };

    const getTextColor = (value) => {
        if (!value) return '#9CA3AF';
        const intensity = value / maxValue;
        return intensity > 0.4 ? 'white' : '#1F2937';
    };

    return (
        <div className="w-full h-full flex flex-col overflow-auto text-xs">
            <div className="flex">
                <div className="w-24 shrink-0"></div>
                {xLabels.map(x => (
                    <div key={x} className="flex-1 min-w-[60px] text-center p-2 font-semibold text-gray-600 truncate" title={x}>
                        {x}
                    </div>
                ))}
            </div>
            
            {yLabels.map(y => (
                <div key={y} className="flex mb-1">
                    <div className="w-24 shrink-0 text-right pr-4 py-2 font-semibold text-gray-600 truncate" title={y}>
                        {y}
                    </div>
                    {xLabels.map(x => {
                        const cell = data.find(d => d.x === x && d.y === y);
                        const val = cell ? cell[valueKey] : 0;
                        const label = cell ? cell[tooltipKey] : '';
                        
                        return (
                            <div 
                                key={`${x}-${y}`} 
                                className="flex-1 min-w-[60px] flex items-center justify-center p-2 mx-[1px] rounded transition-colors"
                                style={{ backgroundColor: getColor(val), color: getTextColor(val) }}
                                title={`${y} - ${x}\n${label || 'Jumlah'}: ${formatNumber(val)}`}
                            >
                                {val > 0 ? formatNumber(val) : '-'}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
