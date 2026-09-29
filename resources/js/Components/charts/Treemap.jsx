import { Treemap as RechartsTreemap, ResponsiveContainer, Tooltip } from 'recharts';
import { formatNumber } from '@/lib/format';
import { defaultPalette } from '@/lib/colors';

const CustomizedContent = (props) => {
    const { root, depth, x, y, width, height, index, payload, colors, rank, name } = props;
    
    // Only render for leaf nodes or if they are large enough
    if (depth < 1) return null;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: defaultPalette[index % defaultPalette.length],
                    stroke: '#fff',
                    strokeWidth: 2 / (depth + 1e-10),
                    strokeOpacity: 1 / (depth + 1e-10),
                }}
            />
            {width > 50 && height > 30 ? (
                <text x={x + 8} y={y + 18} fill="#fff" fontSize={12} fontWeight="bold" className="truncate">
                    {name}
                </text>
            ) : null}
            {width > 50 && height > 45 ? (
                <text x={x + 8} y={y + 34} fill="#fff" fontSize={11} opacity={0.9}>
                    {formatNumber(props.value)}
                </text>
            ) : null}
        </g>
    );
};

export function Treemap({ data, nameKey = 'name', dataKey = 'value' }) {
    if (!data || data.length === 0) return null;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsTreemap
                data={data}
                dataKey={dataKey}
                aspectRatio={4 / 3}
                stroke="#fff"
                fill="#8884d8"
                content={<CustomizedContent />}
            >
                <Tooltip 
                    formatter={(value) => [formatNumber(value), 'Jumlah']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
            </RechartsTreemap>
        </ResponsiveContainer>
    );
}
