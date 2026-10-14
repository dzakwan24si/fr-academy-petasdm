import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber } from '@/lib/format';
import { generationColors, defaultPalette } from '@/lib/colors';

function CustomStackedBarTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;
    const row = payload[0]?.payload;
    const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
    const topTitles = row?.top_titles ? Object.entries(row.top_titles) : [];

    return (
        <div className="bg-white p-3.5 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.15)] border border-gray-200 text-xs min-w-[230px] max-w-[300px] z-50">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2.5">
                <span className="font-bold text-gray-900 text-sm tracking-tight">{label}</span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                    Total: {formatNumber(total)}
                </span>
            </div>

            {/* Breakdown per Generasi / Kategori */}
            <div className="space-y-1.5 mb-2.5">
                {payload.filter(p => Number(p.value) > 0).map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between text-gray-700 text-[11.5px]">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
                            <span className="font-medium">{entry.name}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{formatNumber(entry.value)}</span>
                    </div>
                ))}
            </div>

            {/* Komposisi Jabatan Jika Ada */}
            {topTitles.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-[10.5px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        <span>Jabatan di Level Ini</span>
                        <span>({topTitles.length})</span>
                    </div>
                    <div className="space-y-1">
                        {topTitles.slice(0, 5).map(([title, count]) => (
                            <div key={title} className="flex items-center justify-between text-[11px] text-gray-600 gap-2">
                                <span className="truncate" title={title}>{title}</span>
                                <span className="font-semibold text-gray-900 shrink-0">{formatNumber(count)}</span>
                            </div>
                        ))}
                        {topTitles.length > 5 && (
                            <p className="text-[10px] text-emerald-700 font-medium italic pt-0.5">
                                + {topTitles.length - 5} jabatan lainnya...
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export function StackedBar({ data, keys = [], xAxisKey = 'name', colors, onClick }) {
    if (!data || data.length === 0 || keys.length === 0) return null;

    const getColor = (key, index) => {
        if (colors && colors[key]) return colors[key];
        if (generationColors[key]) return generationColors[key];
        return defaultPalette[index % defaultPalette.length];
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                    dataKey={xAxisKey} 
                    tick={{ fontSize: 10, fontWeight: 500 }} 
                    axisLine={false} 
                    tickLine={false} 
                    interval={0} 
                    angle={-35} 
                    textAnchor="end" 
                    height={60} 
                />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={formatNumber} axisLine={false} tickLine={false} />
                <Tooltip 
                    content={<CustomStackedBarTooltip />}
                    cursor={!onClick ? { fill: '#F3F4F6' } : false}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                {keys.map((key, index) => (
                    <Bar 
                        key={key} 
                        dataKey={key} 
                        stackId="a" 
                        fill={getColor(key, index)} 
                        onClick={(data) => onClick && onClick(key, data?.payload?.[xAxisKey] || data?.[xAxisKey] || data?.name)}
                        className={onClick ? "cursor-pointer hover:opacity-80 transition-opacity outline-none" : ""}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}
