import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatNumber } from '@/lib/format';
import { defaultPalette } from '@/lib/colors';

export function HorizontalBar({ data, nameKey = 'name', dataKey = 'value', color = defaultPalette[0], labelInside = true, onClick }) {
    if (!data || data.length === 0) return null;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={formatNumber} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey={nameKey} tick={{ fontSize: 11 }} tickFormatter={(val) => val.length > 22 ? val.substring(0, 20) + '...' : val} axisLine={false} tickLine={false} width={140} />
                <Tooltip 
                    formatter={(value) => [formatNumber(value), 'Jumlah']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
