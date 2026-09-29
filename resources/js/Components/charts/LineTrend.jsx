import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber } from '@/lib/format';
import { defaultPalette } from '@/lib/colors';

export function LineTrend({ data, keys = ['value'], xAxisKey = 'name', colors }) {
    if (!data || data.length === 0) return null;

    const getColor = (key, index) => {
        if (colors && colors[key]) return colors[key];
        return defaultPalette[index % defaultPalette.length];
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={formatNumber} axisLine={false} tickLine={false} />
                <Tooltip 
                    formatter={(value) => formatNumber(value)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                {keys.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />}
                {keys.map((key, index) => (
                    <Line 
                        key={key} 
                        type="monotone" 
                        dataKey={key} 
                        stroke={getColor(key, index)} 
                        strokeWidth={3} 
                        dot={{ r: 4, strokeWidth: 2 }} 
                        activeDot={{ r: 6 }} 
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}
