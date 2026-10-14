import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import EmployeeAvatar from '@/Components/EmployeeAvatar';
import { 
    X, 
    Upload, 
    Trash2, 
    Camera, 
    Briefcase, 
    Calendar, 
    Clock, 
    User, 
    GraduationCap, 
    AlertCircle,
    Building2,
    MapPin
} from 'lucide-react';

export function StaffDetailModal({ employeeId, onClose }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMsg, setUploadMsg] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        axios.get(`/data/employees/${employeeId}`)
            .then(res => {
                setDetail(res.data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Gagal memuat data');
                setLoading(false);
            });
    }, [employeeId]);

    // Handle escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('photo', file);

        setUploading(true);
        setUploadMsg(null);

        axios.post(`/karyawan/${employeeId}/photo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then(res => {
            setDetail(prev => ({
                ...prev,
                identitas: {
                    ...prev.identitas,
                    photo_url: res.data.photo_url
                }
            }));
            setUploadMsg({ type: 'success', text: 'Foto profil berhasil diperbarui!' });
        })
        .catch(err => {
            setUploadMsg({ type: 'error', text: err.response?.data?.message || 'Gagal mengunggah foto.' });
        })
        .finally(() => {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        });
    };

    const handleDeletePhoto = () => {
        if (!window.confirm('Hapus foto profil karyawan ini?')) return;

        setUploading(true);
        axios.delete(`/karyawan/${employeeId}/photo`)
            .then(res => {
                setDetail(prev => ({
                    ...prev,
                    identitas: {
                        ...prev.identitas,
                        photo_url: null
                    }
                }));
                setUploadMsg({ type: 'success', text: 'Foto profil berhasil dihapus.' });
            })
            .catch(err => {
                setUploadMsg({ type: 'error', text: 'Gagal menghapus foto.' });
            })
            .finally(() => {
                setUploading(false);
            });
    };

    return createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[99999] flex justify-center items-center p-3 sm:p-6 animate-in fade-in duration-200">
            <div 
                className="bg-[#FAFCFA] rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-emerald-100/70 relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Header Modal Minimalis */}
                <div className="px-6 py-4 bg-white border-b border-gray-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-50 text-[#004D40]">
                            <User size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 leading-tight">Detail Profil Karyawan</h2>
                            <p className="text-xs text-gray-500">Informasi komprehensif kepegawaian dan riwayat pelatihan</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
                        title="Tutup (Esc)"
                    >
                        <X size={18} />
                    </button>
                </div>
                
                {/* Modal Body */}
                <div className="p-5 sm:p-7 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                            <p className="text-sm font-medium text-gray-500">Memuat profil karyawan...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-rose-500">
                            <AlertCircle size={36} className="mb-2 opacity-80" />
                            <p className="text-sm font-semibold">{error}</p>
                            <button 
                                onClick={onClose} 
                                className="mt-4 px-4 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    ) : detail && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* ==================== KOLOM KIRI ==================== */}
                            <div className="lg:col-span-4 space-y-5">
                                {/* Card 1: Avatar, Identitas Utama & Upload */}
                                <div className="bg-white rounded-2xl p-6 border border-emerald-50/80 shadow-[0_2px_14px_rgba(6,78,59,0.04)] flex flex-col items-center text-center">
                                    {/* Avatar Foto Profil */}
                                    <div className="relative group shrink-0 mb-3.5">
                                        <EmployeeAvatar 
                                            name={detail.identitas.name} 
                                            photoUrl={detail.identitas.photo_url} 
                                            size="xl" 
                                            className="!w-24 !h-24 sm:!w-28 sm:!h-28 !text-2xl ring-4 ring-emerald-500/10 shadow-md transition-transform duration-200 group-hover:scale-105"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all text-white text-[11px] font-medium backdrop-blur-[2px]"
                                            title="Ubah Foto Profil"
                                        >
                                            <Camera size={20} className="mb-0.5" />
                                            <span>Ubah</span>
                                        </button>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            accept="image/jpeg,image/png,image/webp" 
                                            className="hidden" 
                                            onChange={handlePhotoSelect} 
                                        />
                                    </div>

                                    {/* Nama & NIK */}
                                    <h3 className="text-lg font-bold text-gray-900 leading-snug">{detail.identitas.name}</h3>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-semibold">
                                        <span className="text-gray-400">NIK:</span>
                                        <span>{detail.identitas.employee_id}</span>
                                    </div>

                                    {/* Jabatan */}
                                    <p className="text-xs text-gray-600 mt-2 font-medium px-2">{detail.identitas.job}</p>

                                    {/* Badges Level, Tipe, Generasi */}
                                    <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                                        {detail.identitas.level && (
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                                                Level {detail.identitas.level}
                                            </span>
                                        )}
                                        {detail.kepegawaian.employment_type && (
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-100">
                                                {detail.kepegawaian.employment_type}
                                            </span>
                                        )}
                                        {detail.kepegawaian.generation && (
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-100">
                                                {detail.kepegawaian.generation}
                                            </span>
                                        )}
                                    </div>

                                    {/* Tombol Aksi Foto */}
                                    <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100 w-full">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/70 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                        >
                                            <Upload size={13} />
                                            <span>{uploading ? 'Mengunggah…' : (detail.identitas.photo_url ? 'Ganti Foto' : 'Unggah Foto')}</span>
                                        </button>
                                        {detail.identitas.photo_url && (
                                            <button
                                                type="button"
                                                onClick={handleDeletePhoto}
                                                disabled={uploading}
                                                className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 border border-rose-200/60 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                                                title="Hapus Foto Profil"
                                            >
                                                <Trash2 size={13} />
                                                <span>Hapus</span>
                                            </button>
                                        )}
                                    </div>

                                    {uploadMsg && (
                                        <div className={`mt-3 w-full text-xs p-2 rounded-xl text-center font-medium ${
                                            uploadMsg.type === 'success' 
                                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                                        }`}>
                                            {uploadMsg.text}
                                        </div>
                                    )}

                                    {/* Identitas Organisasi */}
                                    <div className="w-full mt-5 pt-5 border-t border-gray-100 text-left space-y-2.5 text-xs">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-gray-400 font-medium shrink-0">Perusahaan</span>
                                            <span className="text-gray-800 font-semibold text-right">{detail.identitas.company}</span>
                                        </div>
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-gray-400 font-medium shrink-0">Lokasi Kerja</span>
                                            <span className="text-gray-800 font-semibold text-right">{detail.identitas.location}</span>
                                        </div>
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-gray-400 font-medium shrink-0">Departemen</span>
                                            <span className="text-gray-800 font-semibold text-right">{detail.identitas.dept}</span>
                                        </div>
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-gray-400 font-medium shrink-0">Wilayah / Region</span>
                                            <span className="text-gray-800 font-semibold text-right">{detail.identitas.region}</span>
                                        </div>
                                        {detail.identitas.group && (
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-gray-400 font-medium shrink-0">Grup Bisnis</span>
                                                <span className="text-gray-800 font-semibold text-right">{detail.identitas.group}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card 2: Informasi Pribadi (Sensitif) */}
                                <div className="bg-white rounded-2xl p-5 border border-emerald-50/80 shadow-[0_2px_14px_rgba(6,78,59,0.04)] text-left">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#004D40] mb-3 flex items-center gap-1.5">
                                        <User size={13} /> Informasi Pribadi
                                    </h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between py-1 border-b border-gray-50">
                                            <span className="text-gray-400 font-medium">Jenis Kelamin</span>
                                            <span className="text-gray-800 font-semibold">{detail.pribadi.gender || '—'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-50">
                                            <span className="text-gray-400 font-medium">Agama</span>
                                            <span className="text-gray-800 font-semibold">{detail.pribadi.religion || '—'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-50">
                                            <span className="text-gray-400 font-medium">Tempat Lahir</span>
                                            <span className="text-gray-800 font-semibold">{detail.pribadi.birth_place || '—'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-50">
                                            <span className="text-gray-400 font-medium">Tanggal Lahir</span>
                                            <span className="text-gray-800 font-semibold">{detail.pribadi.birth_date || '—'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-50">
                                            <span className="text-gray-400 font-medium">Status Pernikahan</span>
                                            <span className="text-gray-800 font-semibold">{detail.pribadi.marital_status || '—'}</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span className="text-gray-400 font-medium">Kode PTKP Pajak</span>
                                            <span className="text-gray-800 font-semibold">{detail.pribadi.ptkp || '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ==================== KOLOM KANAN ==================== */}
                            <div className="lg:col-span-8 space-y-6">
                                {/* Card 1: Siklus Kerja & Risiko Pensiun */}
                                <div className="bg-white rounded-2xl p-6 border border-emerald-50/80 shadow-[0_2px_14px_rgba(6,78,59,0.04)] text-left">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-emerald-50 text-[#004D40]">
                                                <Briefcase size={16} />
                                            </div>
                                            <h4 className="font-bold text-gray-900 text-sm">Status Kepegawaian & Masa Kerja</h4>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto ${
                                            detail.kepegawaian.retire_risk
                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${detail.kepegawaian.retire_risk ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                                            {detail.kepegawaian.retire_risk ? 'Mendekati / Batas Pensiun (55+ Th)' : 'Masa Aktif Produktif'}
                                        </span>
                                    </div>

                                    {/* Grid 4 Stat Kepegawaian */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                                        <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                                            <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mb-1">
                                                <Calendar size={12} className="text-gray-400" /> Tanggal Masuk
                                            </p>
                                            <p className="text-sm font-bold text-gray-900">{detail.kepegawaian.join_date || '—'}</p>
                                        </div>

                                        <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                                            <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mb-1">
                                                <Clock size={12} className="text-gray-400" /> Masa Kerja (LOS)
                                            </p>
                                            <p className="text-sm font-bold text-gray-900">
                                                {detail.kepegawaian.los ?? '—'} <span className="text-xs font-normal text-gray-500">Tahun</span>
                                            </p>
                                        </div>

                                        <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                                            <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mb-1">
                                                <User size={12} className="text-gray-400" /> Usia Saat Ini
                                            </p>
                                            <p className="text-sm font-bold text-gray-900">
                                                {detail.pribadi.age ?? '—'} <span className="text-xs font-normal text-gray-500">Tahun</span>
                                            </p>
                                        </div>

                                        <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100">
                                            <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mb-1">
                                                <AlertCircle size={12} className="text-gray-400" /> Estimasi Pensiun
                                            </p>
                                            <p className="text-sm font-bold text-gray-900">{detail.kepegawaian.retire_date || '—'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Card 2: Riwayat Pelatihan Terhubung */}
                                <div className="bg-white rounded-2xl p-6 border border-emerald-50/80 shadow-[0_2px_14px_rgba(6,78,59,0.04)] text-left">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                                                <GraduationCap size={16} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm">Riwayat Pelatihan Terhubung</h4>
                                                <p className="text-xs text-gray-400">Catatan pelatihan yang terdaftar atas NIK karyawan</p>
                                            </div>
                                        </div>

                                        {detail.pelatihan?.length > 0 && (
                                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                    {detail.pelatihan.length} Pelatihan
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                                    {detail.pelatihan_total_jam} Jam Total
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {detail.pelatihan?.length > 0 ? (
                                        <div className="overflow-hidden border border-gray-100 rounded-xl">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                                                        <tr>
                                                            <th className="py-2.5 px-3">Periode</th>
                                                            <th className="py-2.5 px-3">Nama Pelatihan</th>
                                                            <th className="py-2.5 px-3 hidden sm:table-cell">Instruktur / Provider</th>
                                                            <th className="py-2.5 px-3 hidden md:table-cell">Jenis</th>
                                                            <th className="py-2.5 px-3 text-right">Jam</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {detail.pelatihan.map((p, i) => (
                                                            <tr key={i} className="hover:bg-emerald-50/20 transition-colors">
                                                                <td className="py-2.5 px-3 text-gray-500 font-medium whitespace-nowrap">{p.month_year}</td>
                                                                <td className="py-2.5 px-3 font-semibold text-gray-800">{p.name}</td>
                                                                <td className="py-2.5 px-3 text-gray-600 hidden sm:table-cell">{p.provider || '—'}</td>
                                                                <td className="py-2.5 px-3 text-gray-500 hidden md:table-cell">
                                                                    {p.regularity ? (
                                                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                                                                            p.regularity === 'Reguler' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                                        }`}>
                                                                            {p.regularity}
                                                                        </span>
                                                                    ) : '—'}
                                                                </td>
                                                                <td className="py-2.5 px-3 text-right font-bold text-[#004D40]">{p.hours}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="bg-gray-50/60 border-t border-gray-100 font-semibold text-gray-800">
                                                        <tr>
                                                            <td colSpan={4} className="py-2.5 px-3 text-right text-gray-500">Total Akumulasi:</td>
                                                            <td className="py-2.5 px-3 text-right font-bold text-[#004D40]">{detail.pelatihan_total_jam} jam</td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-12 px-4 rounded-xl bg-gray-50/60 border border-dashed border-gray-200 text-center">
                                            <GraduationCap size={32} className="mx-auto text-gray-300 mb-2" />
                                            <p className="text-xs font-semibold text-gray-600">Belum Ada Riwayat Pelatihan</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">Tidak ditemukan data pelatihan yang tertaut dengan NIK {detail.identitas.employee_id}.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
