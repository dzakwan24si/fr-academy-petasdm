import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { formatNumber } from '@/lib/format';
import { generationColors, facilityColors, defaultPalette } from '@/lib/colors';

export function DonutChart({ 
    data, 
    nameKey = 'name', 
    dataKey = 'value', 
    colors, 
    unit = '', 
    hideLegend = false, 
    onClick 
}) {
    if (!data || data.length === 0) return null;

    const getColor = (entry, index) => {
        if (entry?.fill) return entry.fill;
        const name = entry?.[nameKey] || entry?.name;
        if (colors && colors[name]) return colors[name];
        if (facilityColors && facilityColors[name]) return facilityColors[name];
        if (generationColors && generationColors[name]) return generationColors[name];
        return defaultPalette[index % defaultPalette.length];
    };

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
        if (percent < 0.05) return null;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="bold" className="pointer-events-none">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius="50%"
                    outerRadius="80%"
                    paddingAngle={2}
                    dataKey={dataKey}
                    nameKey={nameKey}
                    labelLine={false}
                    label={renderCustomizedLabel}
                >
                    {data.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={getColor(entry, index)} 
                            onClick={() => onClick && onClick(entry)}
                            className={onClick ? "cursor-pointer hover:opacity-80 transition-opacity outline-none" : ""}
                        />
                    ))}
                </Pie>
                <RechartsTooltip 
                    formatter={(value, name) => [`${formatNumber(value)}${unit ? ' ' + unit : ''}`, 'Jumlah']} 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '8px 12px' }}
                />
                {!hideLegend && <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />}
            </PieChart>
        </ResponsiveContainer>
    );
}
