import { formatNumber, formatDecimal } from '@/lib/format';

export function KpiCard({ title, value, unit = '', note = '', highlight = false, isDecimal = false, secondaryText = '' }) {
    const displayValue = isDecimal ? formatDecimal(value) : formatNumber(value);
    
    return (
        <div className={`bg-white p-5 rounded-2xl shadow-sm border ${highlight ? 'border-corporate-light ring-1 ring-corporate-light' : 'border-gray-100'} flex flex-col justify-between h-full`}>
            <h3 className="text-sm font-semibold text-gray-500">{title}</h3>
            <div className="mt-2 mb-1 flex items-end gap-1">
                <span className={`text-2xl font-bold ${highlight ? 'text-corporate-dark' : 'text-gray-900'}`}>
                    {displayValue}
                </span>
                {unit && <span className="text-sm font-medium text-gray-500 mb-1">{unit}</span>}
            </div>
            {note && <p className="text-xs text-gray-400 leading-tight">{note}</p>}
            {secondaryText && <p className="text-xs text-corporate-light mt-1 font-medium">{secondaryText}</p>}
        </div>
    );
}
