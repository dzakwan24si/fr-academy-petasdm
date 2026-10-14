import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { useCopyAsImage } from '@/hooks/useCopyAsImage';
import { CopyButton } from './CopyButton';
import { InfoTooltip } from './InfoTooltip';

const DEFAULT_CHART_DESCRIPTIONS = {
    // Dashboard & Demographics
    'Komposisi Generasi': 'Distribusi proporsi karyawan berdasarkan kelompok generasi (Gen Z, Milenial, Gen X, Baby Boomer) untuk melihat keseimbangan demografi tenaga kerja.',
    'Generasi per Level Jabatan': 'Persebaran kelompok generasi pada setiap jenjang hierarki jabatan (Direksi, Manajerial, Supervisor, Staf, Pelaksana) guna memetakan kesiapan suksesi kepemimpinan.',
    'Top 10 Perusahaan (HC)': '10 entitas unit bisnis atau anak perusahaan dengan jumlah tenaga kerja (Headcount) terbanyak.',
    'Tren Jam Pelatihan': 'Grafik perkembangan total jam pelatihan karyawan per bulan/tahun untuk memantau intensitas pembelajaran.',
    'HC per Region': 'Sebaran total jumlah karyawan (Headcount) di setiap wilayah operasional perusahaan.',
    'HC per Group': 'Distribusi total karyawan berdasarkan divisi kelompok bisnis (Group) di lingkungan korporasi.',
    'Distribusi Umur (Histogram)': 'Sebaran frekuensi rentang usia karyawan untuk memetakan konsentrasi kelompok umur tenaga kerja.',
    'Piramida Umur × Gender': 'Grafik piramida demografi yang membandingkan struktur umur antara karyawan laki-laki dan perempuan.',
    'Generasi × Region (Heatmap)': 'Matriks intensitas jumlah karyawan berdasarkan kelompok generasi di masing-masing wilayah kerja operasional.',
    'Rata-rata Umur per Departemen (Top 15, HC >= 5)': 'Rata-rata usia karyawan pada 15 departemen dengan jumlah karyawan aktif minimal 5 orang.',
    'HC per Level Jabatan': 'Proporsi jumlah tenaga kerja pada setiap jenjang jabatan dalam struktur organisasi.',
    'Gender per Level Jabatan': 'Perbandingan rasio karyawan laki-laki dan perempuan pada setiap tingkatan struktur jabatan.',
    'Gender': 'Persentase perbandingan komposisi karyawan laki-laki dan perempuan secara keseluruhan.',
    'Status Pernikahan': 'Distribusi status pernikahan karyawan (Menikah, Belum Menikah, Cerai/Duda/Janda) berdasarkan data kepegawaian.',
    'PTKP': 'Distribusi Penghasilan Tidak Kena Pajak (PTKP) berdasarkan tanggungan keluarga karyawan untuk keperluan administrasi perpajakan.',
    'Status Karyawan per Region': 'Komposisi status kepegawaian (Karyawan Tetap, Kontrak, PKWT) pada tiap wilayah operasional.',
    'Top 10 Tempat Lahir': '10 daerah asal (kota/kabupaten tempat lahir) terbanyak dari seluruh karyawan.',

    // Retirement
    'Proyeksi Pensiun (Tahun Berjalan + 5 Tahun)': 'Estimasi jumlah karyawan yang akan mencapai batas usia pensiun normal (55 tahun) dalam kurun waktu 5 tahun mendatang.',
    'Risiko Pensiun per Region (HC)': 'Jumlah karyawan yang telah mencapai atau mendekati usia pensiun (>= 55 tahun) di masing-masing wilayah operasional.',
    'Risiko per Perusahaan (Top 10)': '10 perusahaan atau unit kerja dengan jumlah karyawan berisiko pensiun terbanyak.',

    // Tenure
    'Distribusi Masa Kerja': 'Persebaran rentang lama masa kerja karyawan (Length of Service) dalam hitungan tahun.',
    'Rata-rata Masa Kerja per Region (Tahun)': 'Rata-rata lama pengabdian kerja karyawan di masing-masing wilayah operasional.',
    'Rata-rata Masa Kerja per Level (Tahun)': 'Rata-rata lama masa kerja karyawan pada setiap jenjang hierarki jabatan.',
    'Sebaran Umur vs Masa Kerja (Anomali)': 'Scatter plot hubungan usia dan masa kerja untuk mendeteksi anomali data (misal masa kerja melebihi usia atau tanggal mulai kerja tidak wajar).',
    'Heatmap Rekrutmen (Tahun x Region)': 'Pola intensitas penerimaan karyawan baru berdasarkan tahun rekrutmen di setiap wilayah kerja.',

    // Training
    'Tren Jam & Peserta Pelatihan': 'Grafik tren perkembangan total akumulasi jam pelatihan dan jumlah peserta yang berpartisipasi.',
    'Reguler vs Non Reguler': 'Perbandingan pelatihan terprogram sesuai kalender tahunan (reguler) dengan pelatihan ad-hoc / penugasan khusus (non-reguler).',
    'Internal vs Eksternal': 'Perbandingan pelatihan yang difasilitasi instruktur internal perusahaan versus lembaga / vendor eksternal.',
    'Gender x Level (Peserta)': 'Persebaran peserta pelatihan berdasarkan gender pada masing-masing tingkatan jabatan.',
    'Top 10 Pelatihan': '10 topik atau judul program pelatihan dengan akumulasi durasi jam pelatihan terbanyak.',
    'Top 10 Instruktur': '10 instruktur, fasilitator, atau lembaga penyelenggara dengan frekuensi pelatihan terbanyak.',
    'Top 10 Tempat': '10 lokasi fisik atau platform daring yang paling sering digunakan dalam pelaksanaan pelatihan.',
    'Total Jam per Region': 'Akumulasi seluruh jam pelatihan yang diikuti karyawan di tiap wilayah operasional.',
    'Total Jam per Group': 'Akumulasi total jam pelatihan pada masing-masing kelompok bisnis (Group).',
    'Total Jam per Departemen (Top 15)': '15 departemen dengan akumulasi jam pelatihan tertinggi.',
    'Total Jam - Golongan': 'Sebaran total jam pelatihan berdasarkan golongan kepangkatan karyawan.',
    'Total Jam - Level': 'Sebaran total jam pelatihan berdasarkan tingkatan jenjang jabatan.',
    'Korelasi Masa Kerja vs Total Jam Pelatihan': 'Analisis korelasi antara lama masa pengabdian karyawan dengan total jam pelatihan yang telah diperoleh.',

    // Company profile
    'Distribusi Level Jabatan': 'Komposisi jenjang jabatan karyawan pada unit perusahaan ini.',
    'Top 8 Departemen / Organisasi': 'Departemen atau unit organisasi dengan jumlah personel terbanyak pada perusahaan ini.',
};

function extractTextFromReactNode(node) {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(extractTextFromReactNode).join(' ').trim();
    if (node?.props?.children) return extractTextFromReactNode(node.props.children);
    return '';
}

function resolveChartDescription(title, explicitDesc) {
    if (explicitDesc) return explicitDesc;
    if (!title) return null;

    const titleStr = typeof title === 'string' ? title : extractTextFromReactNode(title);
    if (!titleStr) return null;

    if (DEFAULT_CHART_DESCRIPTIONS[titleStr]) {
        return DEFAULT_CHART_DESCRIPTIONS[titleStr];
    }

    const lower = titleStr.toLowerCase();
    for (const [key, desc] of Object.entries(DEFAULT_CHART_DESCRIPTIONS)) {
        if (lower === key.toLowerCase() || lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
            return desc;
        }
    }

    if (lower.includes('generasi')) {
        return 'Visualisasi sebaran komposisi generasi karyawan (Gen Z, Milenial, Gen X, Baby Boomer).';
    }
    if (lower.includes('pensiun')) {
        return 'Visualisasi data proyeksi dan risiko masa pensiun karyawan (usia >= 55 tahun).';
    }
    if (lower.includes('pelatihan') || lower.includes('training')) {
        return 'Visualisasi data keikutsertaan dan jam pelatihan karyawan.';
    }
    if (lower.includes('masa kerja') || lower.includes('los')) {
        return 'Visualisasi distribusi masa kerja karyawan (Length of Service).';
    }
    if (lower.includes('rekrutmen') || lower.includes('hire')) {
        return 'Visualisasi tren penerimaan dan gelombang rekrutmen karyawan.';
    }
    if (lower.includes('umur') || lower.includes('usia')) {
        return 'Visualisasi demografi kelompok umur karyawan.';
    }
    if (lower.includes('gender') || lower.includes('jenis kelamin')) {
        return 'Visualisasi perbandingan keterwakilan gender karyawan.';
    }
    if (lower.includes('level jabatan') || lower.includes('jenjang')) {
        return 'Visualisasi sebaran tingkatan struktur jenjang jabatan karyawan.';
    }

    return null;
}

export function ChartCard({ title, action, description, loading, isEmpty, children, className = '', height = "h-72" }) {
    const titleStr = typeof title === 'string' ? title : (extractTextFromReactNode(title) || 'chart');
    const { ref: cardRef, isCopying, status, handleCopy } = useCopyAsImage({ title: titleStr });
    const resolvedDesc = resolveChartDescription(title, description);

    return (
        <div ref={cardRef} className={`bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(6,78,59,0.08)] border-0 transition-all duration-300 [@media(hover:hover)]:hover:shadow-[0_8px_30px_rgba(6,78,59,0.12)] [@media(hover:hover)]:hover:-translate-y-1 flex flex-col relative hover:z-40 focus-within:z-40 ${className}`}>
            <CopyButton handleCopy={handleCopy} status={status} isCopying={isCopying} loading={loading} />

            <div className="flex items-center justify-between gap-3 pb-3 mb-4 pr-12 border-b border-gray-100/60 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="font-bold text-gray-800 text-sm sm:text-base leading-snug">{title}</h3>
                    {resolvedDesc && <InfoTooltip title={titleStr} text={resolvedDesc} />}
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </div>

            <div className={`relative w-full min-h-[18rem] ${height}`}>
                {loading ? (
                    <div className="absolute inset-0 flex items-end justify-between gap-2 p-4">
                        <Skeleton className="w-1/6 h-1/3" />
                        <Skeleton className="w-1/6 h-2/3" />
                        <Skeleton className="w-1/6 h-1/2" />
                        <Skeleton className="w-1/6 h-full" />
                        <Skeleton className="w-1/6 h-3/4" />
                    </div>
                ) : isEmpty ? (
                    <EmptyState />
                ) : (
                    children
                )}
            </div>
        </div>
    );
}
