import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber } from '@/lib/format';
import { generationColors, defaultPalette } from '@/lib/colors';

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
                <XAxis dataKey={xAxisKey} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={formatNumber} axisLine={false} tickLine={false} />
                <Tooltip 
                    formatter={(value) => formatNumber(value)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
