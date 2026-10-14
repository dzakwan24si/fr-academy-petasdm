import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatNumber } from '@/lib/format';
import { defaultPalette } from '@/lib/colors';

function CustomHorizontalBarTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;
    const entry = payload[0];
    const row = entry?.payload;
    const topTitles = row?.top_titles ? Object.entries(row.top_titles) : [];

    return (
        <div className="bg-white p-3.5 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.15)] border border-gray-200 text-xs min-w-[220px] max-w-[290px] z-50">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                <span className="font-bold text-gray-900 text-sm tracking-tight">{row?.name || label}</span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                    Total: {formatNumber(entry.value)}
                </span>
            </div>

            {topTitles.length > 0 && (
                <div className="pt-1">
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

export function HorizontalBar({ data, nameKey = 'name', dataKey = 'value', color = defaultPalette[0], labelInside = true, onClick }) {
    if (!data || data.length === 0) return null;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={formatNumber} axisLine={false} tickLine={false} />
                <YAxis 
                    type="category" 
                    dataKey={nameKey} 
                    tick={{ fontSize: 11 }} 
                    tickFormatter={(val) => {
                        const str = String(val ?? '');
                        return str.length > 22 ? str.substring(0, 20) + '...' : str;
                    }} 
                    axisLine={false} 
                    tickLine={false} 
                    width={140} 
                />
                <Tooltip 
                    content={<CustomHorizontalBarTooltip />}
                    cursor={!onClick ? { fill: '#F3F4F6' } : false}
                />
                <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color || color} 
                            onClick={() => onClick && onClick(entry)}
                            className={onClick ? "cursor-pointer hover:opacity-80 transition-opacity outline-none" : ""}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
