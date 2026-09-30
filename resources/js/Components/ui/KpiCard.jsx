import { formatNumber, formatDecimal } from '@/lib/format';
import { TrendingUp, Users, Activity, BarChart2, Calendar, Target, GraduationCap, Briefcase } from 'lucide-react';

export function KpiCard({ title, value, unit = '', note = '', highlight = false, isDecimal = false, secondaryText = '' }) {
    const displayValue = isDecimal ? formatDecimal(value) : formatNumber(value);
    
    // Choose icon based on title
    let Icon = BarChart2;
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

    return (
        <div className={`bg-white p-5 rounded-2xl shadow-sm border ${highlight ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100'} flex flex-col justify-between h-full relative overflow-hidden group`}>
            {/* Subtle background decoration for highlight */}
            {highlight && (
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500 rounded-full blur-3xl opacity-10 pointer-events-none transition-transform group-hover:scale-110"></div>
            )}
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
                <div className={`p-2 rounded-xl flex-shrink-0 ${highlight ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
                    <Icon size={16} strokeWidth={2.5} />
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
