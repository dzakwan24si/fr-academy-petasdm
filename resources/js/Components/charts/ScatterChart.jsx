import { ScatterChart as RechartsScatter, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { defaultPalette } from '@/lib/colors';

export function ScatterChart({ data, xKey = 'umur', yKey = 'masa_kerja', zKey = 'anomali', xLabel = 'X', yLabel = 'Y' }) {
    if (!data || data.length === 0) return null;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const pointData = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg text-sm">
                    <p className="font-semibold text-gray-800 mb-1">
                        {xLabel}: {pointData[xKey]}
                    </p>
                    <p className="text-gray-600">
                        {yLabel}: {pointData[yKey]}
                    </p>
                    {pointData.join_age && (
                        <p className="text-gray-600 mt-1">
                            Umur Masuk: {pointData.join_age} tahun
                        </p>
                    )}
                    {pointData[zKey] === 'yes' && (
                        <p className="text-red-600 mt-1 font-bold text-xs">
                            ⚠️ Anomali (Usia masuk &lt; 18 atau &gt; 55)
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsScatter margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                    type="number" 
                    dataKey={xKey} 
                    name={xLabel} 
                    tick={{ fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false}
                    domain={['auto', 'auto']}
                />
                <YAxis 
                    type="number" 
                    dataKey={yKey} 
                    name={yLabel} 
                    tick={{ fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Karyawan" data={data}>
                    {data.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={entry[zKey] === 'yes' ? '#EF4444' : '#60A5FA'} 
                            fillOpacity={entry[zKey] === 'yes' ? 1 : 0.6}
                        />
                    ))}
                </Scatter>
            </RechartsScatter>
        </ResponsiveContainer>
    );
}
