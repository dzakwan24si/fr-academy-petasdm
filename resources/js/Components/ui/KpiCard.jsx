import { formatNumber, formatDecimal } from '@/lib/format';
import { TrendingUp, Users, Activity, BarChart2, Calendar, Target, GraduationCap, Briefcase } from 'lucide-react';
import { InfoTooltip } from '@/Components/ui/InfoTooltip';

const DEFAULT_KPI_DESCRIPTIONS = {
    'Total Karyawan': 'Total seluruh tenaga kerja aktif (Headcount) yang tercatat dalam sistem dan sesuai filter aktif saat ini.',
    'Rata-rata Umur': 'Rata-rata usia seluruh karyawan aktif dihitung dari tanggal lahir hingga saat ini (dalam satuan tahun).',
    'Rata-rata Masa Kerja': 'Rata-rata lama masa pengabdian kerja karyawan (Length of Service) dihitung sejak tanggal bergabung (join date).',
    'Risiko Pensiun': 'Jumlah karyawan yang berusia 55 tahun ke atas atau akan memasuki masa pensiun dalam waktu dekat (<= 5 tahun).',
    'Karyawan Baru Belum Dilatih (<1 Tahun)': 'Karyawan dengan masa kerja di bawah 1 tahun yang belum tercatat memiliki riwayat pelatihan. Perlu diprioritaskan onboarding.',
    'Karyawan Baru Masuk Tahun Ini': 'Jumlah karyawan baru yang direkrut dan mulai aktif bekerja terhitung sejak awal tahun kalender berjalan.',
    'Total Jam Pelatihan': 'Akumulasi total jam pelatihan dari seluruh sesi yang berhasil terhubung dengan data master karyawan.',
    'Training Coverage': 'Persentase perbandingan antara karyawan yang telah mengikuti minimal satu pelatihan terhadap total seluruh karyawan aktif.',
};

function resolveKpiDescription(title, explicitDesc) {
    if (explicitDesc) return explicitDesc;
    if (!title) return null;

    if (DEFAULT_KPI_DESCRIPTIONS[title]) {
        return DEFAULT_KPI_DESCRIPTIONS[title];
    }

    const lower = title.toLowerCase();
    for (const [key, desc] of Object.entries(DEFAULT_KPI_DESCRIPTIONS)) {
        if (lower === key.toLowerCase() || lower.includes(key.toLowerCase())) {
            return desc;
        }
    }

    if (lower.includes('total karyawan') || lower.includes('headcount') || lower.includes('total hc')) {
        return 'Total tenaga kerja aktif terdaftar dalam sistem.';
    }
    if (lower.includes('umur') || lower.includes('usia')) {
        return 'Rata-rata usia karyawan dalam satuan tahun.';
    }
    if (lower.includes('masa kerja') || lower.includes('los')) {
        return 'Rata-rata lama pengabdian kerja karyawan sejak tanggal awal masuk.';
    }
    if (lower.includes('pensiun')) {
        return 'Jumlah karyawan berisiko pensiun (usia 55 tahun ke atas).';
    }
    if (lower.includes('belum dilatih')) {
        return 'Karyawan masa kerja < 1 tahun yang belum tercatat pernah mengikuti pelatihan.';
    }
    if (lower.includes('karyawan baru') || lower.includes('new hire')) {
        return 'Karyawan yang baru bergabung pada periode tahun kalender berjalan.';
    }
    if (lower.includes('jam pelatihan') || lower.includes('training hours')) {
        return 'Total akumulasi durasi pelatihan karyawan dalam satuan jam.';
    }
    if (lower.includes('coverage') || lower.includes('cakupan')) {
        return 'Persentase karyawan yang telah tersentuh minimal satu program pelatihan.';
    }

    return null;
}

export function KpiCard({ title, value, unit = '', note = '', highlight = false, isDecimal = false, secondaryText = '', icon: CustomIcon, description }) {
    const displayValue = isDecimal ? formatDecimal(value) : formatNumber(value);
    const resolvedDesc = resolveKpiDescription(title, description);
    
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
        <div className={`bg-white p-3.5 sm:p-4 rounded-xl shadow-[0_4px_20px_rgba(6,78,59,0.08)] ${borderClass} transition-all duration-300 [@media(hover:hover)]:hover:shadow-[0_8px_30px_rgba(6,78,59,0.12)] [@media(hover:hover)]:hover:-translate-y-1 flex flex-col justify-between h-full relative hover:z-40 focus-within:z-40 group`}>
            {/* Subtle background decoration for highlight (contained so tooltips aren't clipped) */}
            {highlight && (
                <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500 rounded-full blur-3xl opacity-10 transition-transform group-hover:scale-110"></div>
                </div>
            )}
            
            <div className="flex justify-between items-start mb-3 sm:mb-4 relative z-10">
                <div className="flex items-center gap-1.5 pr-1.5 sm:pr-2 min-w-0">
                    <h3 className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider leading-snug">{title}</h3>
                    {resolvedDesc && <InfoTooltip title={title} text={resolvedDesc} />}
                </div>
                <div className={`p-2 sm:p-2.5 rounded-full flex-shrink-0 ${iconBgClass}`}>
                    <Icon size={20} className="sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} />
                </div>
            </div>
            
            <div className="relative">
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                        {displayValue}
                    </span>
                    {unit && <span className="text-xs sm:text-sm font-semibold text-gray-400 ml-1">{unit}</span>}
                </div>
                
                {(note || secondaryText) && (
                    <div className="mt-2.5 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2 items-center">
                        {note && (
                            <span className="inline-flex items-center text-[10px] sm:text-[11px] font-medium bg-gray-50 text-gray-500 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-gray-100">
                                {note}
                            </span>
                        )}
                        {secondaryText && (
                            <span className="inline-flex items-center text-[10px] sm:text-[11px] font-medium text-amber-600 bg-amber-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                                {secondaryText}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
