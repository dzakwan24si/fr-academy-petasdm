import { formatNumber, formatDecimal } from '@/lib/format';
import { TrendingUp, Users, Activity, BarChart2, Calendar, Target, GraduationCap, Briefcase } from 'lucide-react';

export function KpiCard({ title, value, unit = '', note = '', highlight = false, isDecimal = false, secondaryText = '', icon: CustomIcon }) {
    const displayValue = isDecimal ? formatDecimal(value) : formatNumber(value);
    
    // Choose icon based on title
    let Icon = CustomIcon || BarChart2;
    if (!CustomIcon) {
        const tl = title.toLowerCase();
        if (tl.includes('karyawan') || tl.includes('perempuan') || tl.includes('gen')) {
            Icon = Users;
        } else if (tl.includes('umur') || tl.includes('masa kerja')) {
            Icon = Activity;
        } else if (tl.includes('pensiun')) {
            Icon = TrendingUp;
        } else if (tl.includes('pelatihan') || tl.includes('training')) {
            Icon = GraduationCap;
        }
    }

    const tlLower = title.toLowerCase();
    const needsAttention = tlLower.includes('risiko') || tlLower.includes('belum dilatih') || tlLower.includes('anomali') || highlight;
    const borderClass = needsAttention ? 'border border-amber-500' : 'border border-[#40826D]/40';
    const iconBgClass = needsAttention ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-[#40826D]';

    return (
        <div className={`bg-white p-4 rounded-xl shadow-[0_4px_20px_rgba(6,78,59,0.08)] ${borderClass} transition-all duration-300 [@media(hover:hover)]:hover:shadow-[0_8px_30px_rgba(6,78,59,0.12)] [@media(hover:hover)]:hover:-translate-y-1 flex flex-col justify-between h-full relative overflow-hidden group`}>
            {/* Subtle background decoration for highlight */}
            {highlight && (
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500 rounded-full blur-3xl opacity-10 pointer-events-none transition-transform group-hover:scale-110"></div>
            )}
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider pr-2">{title}</h3>
                <div className={`p-2.5 rounded-full flex-shrink-0 ${iconBgClass}`}>
                    <Icon size={22} strokeWidth={2.5} />
                </div>
            </div>
            
            <div className="relative z-10">
                <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold tracking-tight ${highlight ? 'text-gray-900' : 'text-gray-900'}`}>
                        {displayValue}
                    </span>
                    {unit && <span className="text-sm font-semibold text-gray-400 ml-1">{unit}</span>}
                </div>
                
                {(note || secondaryText) && (
                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                        {note && (
                            <span className="inline-flex items-center text-[11px] font-medium bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full border border-gray-100">
                                {note}
                            </span>
                        )}
                        {secondaryText && (
                            <span className="inline-flex items-center text-[11px] font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                                {secondaryText}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
