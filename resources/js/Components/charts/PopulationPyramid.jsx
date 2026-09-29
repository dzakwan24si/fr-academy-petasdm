import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { formatNumber } from '@/lib/format';

export function PopulationPyramid({ data, yAxisKey = 'ageGroup', leftKey = 'Male', rightKey = 'Female', leftColor = '#0EA5E9', rightColor = '#EC4899' }) {
    if (!data || data.length === 0) return null;

    // Transform data for pyramid: left side negative, right side positive
    const pyramidData = data.map(d => ({
        ...d,
        _left: -Math.abs(d[leftKey] || 0),
        _right: Math.abs(d[rightKey] || 0),
        _rawLeft: d[leftKey] || 0,
        _rawRight: d[rightKey] || 0,
    }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-100 rounded-lg shadow-md text-sm">
                    <p className="font-bold mb-2">{label}</p>
                    {payload.map(p => (
                        <p key={p.dataKey} style={{ color: p.color }}>
                            {p.name}: {formatNumber(Math.abs(p.value))}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pyramidData} layout="vertical" margin={{ top: 20, right: 20, left: 20, bottom: 0 }} stackOffset="sign">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                <XAxis 
                    type="number" 
                    tick={{ fontSize: 11 }} 
                    tickFormatter={(val) => formatNumber(Math.abs(val))} 
                    axisLine={false} 
                    tickLine={false} 
                />
                <YAxis 
                    type="category" 
                    dataKey={yAxisKey} 
                    tick={{ fontSize: 12, fontWeight: 'bold' }} 
                    axisLine={false} 
                    tickLine={false} 
                    width={80} 
                    orientation="left"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <ReferenceLine x={0} stroke="#9CA3AF" />
                <Bar dataKey="_left" name={leftKey} fill={leftColor} stackId="a" radius={[4, 0, 0, 4]} />
                <Bar dataKey="_right" name={rightKey} fill={rightColor} stackId="a" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
