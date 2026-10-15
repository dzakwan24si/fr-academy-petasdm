import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber } from '@/lib/format';
import { defaultPalette } from '@/lib/colors';

export function LineTrend({ 
    data, 
    keys = ['value'], 
    lines, 
    xAxisKey = 'name', 
    colors, 
    labels = {}, 
    dualAxis = false 
}) {
    if (!data || data.length === 0) return null;

    const effectiveKeys = lines ? lines.map((l) => l.dataKey) : keys;

    const getColor = (key, index) => {
        if (lines) {
            const lineObj = lines.find((l) => l.dataKey === key);
            if (lineObj?.stroke) return lineObj.stroke;
        }
        if (colors && colors[key]) return colors[key];
        return defaultPalette[index % defaultPalette.length];
    };

    const getLabel = (key) => {
        if (lines) {
            const lineObj = lines.find((l) => l.dataKey === key);
            if (lineObj?.name) return lineObj.name;
        }
        if (labels && labels[key]) return labels[key];
        if (key === 'hours') return 'Total Jam';
        if (key === 'participants') return 'Jumlah Peserta';
        return key;
    };

    const getUnit = (key) => {
        if (key === 'hours' || key === 'Jam') return ' jam';
        if (key === 'participants' || key === 'Peserta') return ' peserta';
        return '';
    };

    const isDual = dualAxis && effectiveKeys.length === 2;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart 
                data={data} 
                margin={{ 
                    top: 10, 
                    right: isDual ? 25 : 10, 
                    left: isDual ? 10 : -20, 
                    bottom: 0 
                }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                    dataKey={xAxisKey} 
                    tick={{ fontSize: 12, fill: '#6B7280' }} 
                    axisLine={false} 
                    tickLine={false} 
                />
                
                {isDual ? (
                    <>
                        <YAxis 
                            yAxisId="left"
                            orientation="left"
                            tick={{ fontSize: 12, fill: getColor(effectiveKeys[0], 0) }} 
                            tickFormatter={formatNumber} 
                            axisLine={false} 
                            tickLine={false} 
                            width={50}
                        />
                        <YAxis 
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 12, fill: getColor(effectiveKeys[1], 1) }} 
                            tickFormatter={formatNumber} 
                            axisLine={false} 
                            tickLine={false} 
                            width={40}
                        />
                    </>
                ) : (
                    <YAxis 
                        tick={{ fontSize: 12, fill: '#6B7280' }} 
                        tickFormatter={formatNumber} 
                        axisLine={false} 
                        tickLine={false} 
                    />
                )}

                <Tooltip 
                    formatter={(value, name) => [
                        `${formatNumber(value)}${getUnit(name)}`, 
                        getLabel(name)
                    ]}
                    contentStyle={{ 
                        borderRadius: '12px', 
                        border: '1px solid #E5E7EB', 
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                        padding: '10px 14px',
                        backgroundColor: '#FFFFFF'
                    }}
                    labelStyle={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}
                />

                {effectiveKeys.length > 1 && (
                    <Legend 
                        iconType="circle" 
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} 
                        formatter={(value) => getLabel(value)}
                    />
                )}

                {effectiveKeys.map((key, index) => (
                    <Line 
                        key={key} 
                        yAxisId={isDual ? (index === 0 ? 'left' : 'right') : undefined}
                        type="monotone" 
                        dataKey={key} 
                        name={key}
                        stroke={getColor(key, index)} 
                        strokeWidth={2.5} 
                        dot={{ r: 4, strokeWidth: 2, fill: '#FFFFFF', stroke: getColor(key, index) }} 
                        activeDot={{ r: 6, stroke: getColor(key, index), strokeWidth: 2 }} 
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}
