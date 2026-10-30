import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import EmployeeAvatar from '@/Components/EmployeeAvatar';
import { 
    Briefcase, Calendar, Clock, User, GraduationCap, Award, 
    Building2, MapPin, Printer, Camera, Trash2, AlertCircle, 
    CheckCircle2, Sparkles, Shield, ChevronRight, FileSpreadsheet,
    Activity, BookOpen, Layers
} from 'lucide-react';

export default function StaffDetailPane({ employeeId }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMsg, setUploadMsg] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!employeeId) return;

        setLoading(true);
        setError(null);
        setUploadMsg(null);

        axios.get(`/data/employees/${employeeId}`)
            .then(res => {
                setDetail(res.data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Gagal memuat detail karyawan.');
                setLoading(false);
            });
    }, [employeeId]);

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
            .then(() => {
                setDetail(prev => ({
                    ...prev,
                    identitas: {
                        ...prev.identitas,
                        photo_url: null
                    }
                }));
                setUploadMsg({ type: 'success', text: 'Foto profil berhasil dihapus.' });
            })
            .catch(() => {
                setUploadMsg({ type: 'error', text: 'Gagal menghapus foto profil.' });
            })
            .finally(() => {
                setUploading(false);
            });
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {/* Skeleton Card 1: Identity */}
                <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-200 shrink-0" />
                        <div className="space-y-2.5 flex-1">
                            <div className="h-6 w-52 bg-slate-200 rounded-md" />
                            <div className="h-4 w-36 bg-slate-200 rounded-md" />
                            <div className="h-4 w-60 bg-slate-100 rounded-md" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-gray-100">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-14 bg-slate-100 rounded-lg" />
                        ))}
                    </div>
                </div>

                {/* Skeleton Card 2 & 3: Org & Personal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-5 space-y-3">
                        <div className="h-5 w-40 bg-slate-200 rounded-md mb-2" />
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-4 bg-slate-100 rounded-md" />
                        ))}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-5 space-y-3">
                        <div className="h-5 w-40 bg-slate-200 rounded-md mb-2" />
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-4 bg-slate-100 rounded-md" />
                        ))}
                    </div>
                </div>

                {/* Skeleton Card 4: Pelatihan */}
                <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-5 space-y-4">
                    <div className="h-5 w-48 bg-slate-200 rounded-md" />
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-slate-100 rounded-lg" />
                        ))}
                    </div>
                    <div className="h-28 bg-slate-50 rounded-lg border border-slate-100" />
                </div>
            </div>
        );
    }

    if (error || !detail) {
        return (
            <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-10 text-center space-y-3">
                <div className="w-11 h-11 rounded-lg bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
                    <AlertCircle size={22} />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">Gagal Memuat Data</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">{error || 'Data karyawan tidak ditemukan.'}</p>
            </div>
        );
    }

    const { identitas, pribadi, kepegawaian, pelatihan = [], pelatihan_total_jam = 0 } = detail;

    return (
        <div className="space-y-4 print:p-0">
            {/* ALERT NOTIFICATION TOAST */}
            {uploadMsg && (
                <div className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
                    uploadMsg.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}>
                    <div className="flex items-center gap-2">
                        {uploadMsg.type === 'success' ? <CheckCircle2 size={15} className="text-emerald-600" /> : <AlertCircle size={15} className="text-rose-600" />}
                        <span>{uploadMsg.text}</span>
                    </div>
                    <button onClick={() => setUploadMsg(null)} className="text-slate-400 hover:text-slate-700">✕</button>
                </div>
            )}

            {/* CARD 1: IDENTITY & QUICK STATS */}
            <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 relative overflow-hidden">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                    {/* Left: Avatar + Identity */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                        {/* Avatar with Camera Button */}
                        <div className="relative group shrink-0">
                            {identitas.photo_url ? (
                                <img 
                                    src={identitas.photo_url} 
                                    alt={identitas.name} 
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-2 ring-emerald-100 border border-emerald-300 shadow-2xs transition-transform group-hover:scale-102"
                                />
                            ) : (
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#004D40] to-emerald-800 text-white font-black text-2xl sm:text-3xl flex items-center justify-center ring-2 ring-emerald-100 border border-emerald-300 shadow-2xs">
                                    {identitas.name?.charAt(0) || 'K'}
                                </div>
                            )}

                            {/* Camera overlay for upload */}
                            <label 
                                htmlFor="staff-photo-input"
                                className="absolute bottom-0 right-0 p-1.5 bg-[#004D40] hover:bg-[#00382e] text-white rounded-full shadow-xs border-2 border-white cursor-pointer transition-transform hover:scale-110"
                                title="Unggah / Ganti Foto"
                            >
                                <Camera size={13} />
                            </label>
                            <input 
                                type="file" 
                                id="staff-photo-input" 
                                ref={fileInputRef}
                                accept="image/jpeg,image/png,image/jpg,image/webp" 
                                onChange={handlePhotoSelect} 
                                className="hidden" 
                                disabled={uploading}
                            />
                        </div>

                        {/* Name & Role */}
                        <div>
                            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                                    {identitas.name}
                                </h2>
                                <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                                    {identitas.employee_id}
                                </span>
                            </div>

                            <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                                <Briefcase size={14} className="text-emerald-700 shrink-0" />
                                <span>{identitas.job}</span>
                            </p>

                            <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center sm:justify-start gap-1.5">
                                <MapPin size={12} className="text-slate-400 shrink-0" />
                                <span>{identitas.location} · {identitas.company}</span>
                            </p>

                            {/* Delete photo text if photo exists */}
                            {identitas.photo_url && (
                                <button
                                    onClick={handleDeletePhoto}
                                    disabled={uploading}
                                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold mt-1.5 inline-flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                    <Trash2 size={11} />
                                    <span>Hapus foto</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-center sm:justify-end print:hidden">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#004D40] hover:bg-[#00382e] text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                            <Printer size={13} />
                            <span>Cetak Profil (A4)</span>
                        </button>
                    </div>
                </div>

                {/* 4 Quick Info Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-gray-100">
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Level / Golongan</span>
                        <p className="text-xs font-black text-slate-900 mt-0.5 truncate">{identitas.level || '-'}</p>
                    </div>

                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lokasi & Kebun</span>
                        <p className="text-xs font-black text-slate-900 mt-0.5 truncate">{identitas.location || '-'}</p>
                    </div>

                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Kerja</span>
                        <p className="text-xs font-black text-slate-900 mt-0.5 truncate">{kepegawaian.employment_type || '-'}</p>
                    </div>

                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Region Wilayah</span>
                        <p className="text-xs font-black text-slate-900 mt-0.5 truncate">{identitas.region || '-'}</p>
                    </div>
                </div>
            </div>

            {/* CARD 2 & 3: 2-COLUMN STRUCTURE (ORGANIZATION & PERSONAL) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Penempatan & Struktur Organisasi */}
                <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-5 space-y-3.5">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
                        <div className="w-7 h-7 rounded-md bg-emerald-50 text-[#004D40] flex items-center justify-center">
                            <Building2 size={15} />
                        </div>
                        <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                            Penempatan &amp; Organisasi
                        </h3>
                    </div>

                    <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Perusahaan / PT</span>
                            <span className="font-bold text-slate-800 text-right">{identitas.company || '-'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Lokasi / Kebun</span>
                            <span className="font-bold text-slate-800 text-right">{identitas.location || '-'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Departemen</span>
                            <span className="font-bold text-slate-800 text-right">{identitas.dept || '-'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Jabatan &amp; Kode</span>
                            <span className="font-bold text-slate-800 text-right">{identitas.job || '-'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Level / Grade</span>
                            <span className="font-bold text-slate-800 text-right">{identitas.level || '-'}</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-slate-400 font-medium">Group Usaha</span>
                            <span className="font-bold text-slate-800 text-right">{identitas.group || 'FR'}</span>
                        </div>
                    </div>

                    {/* Masa Kerja Box */}
                    <div className="mt-3.5 pt-3 border-t border-gray-100 space-y-2.5 text-xs">
                        <div className="flex items-center gap-1.5 pb-1">
                            <Calendar size={14} className="text-emerald-700" />
                            <h4 className="font-bold text-slate-800 text-xs">Masa Kerja &amp; Pensiun</h4>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Tanggal Bergabung</span>
                            <span className="font-bold text-slate-800">{kepegawaian.join_date || '-'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Lama Masa Kerja</span>
                            <span className="font-bold text-emerald-800">{kepegawaian.los || 0} Tahun</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-slate-400 font-medium">Proyeksi Pensiun (55 Thn)</span>
                            <span className={`font-bold ${kepegawaian.retire_risk ? 'text-rose-600' : 'text-slate-800'}`}>
                                {kepegawaian.retire_date || '-'} {kepegawaian.retire_risk ? '(Mendekati)' : ''}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Data Pribadi & Demografi */}
                <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-5 space-y-3.5">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
                        <div className="w-7 h-7 rounded-md bg-emerald-50 text-[#004D40] flex items-center justify-center">
                            <User size={15} />
                        </div>
                        <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                            Data Pribadi &amp; Demografi
                        </h3>
                    </div>

                    <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Usia &amp; Generasi</span>
                            <span className="font-bold text-slate-800 text-right">
                                {pribadi.age || '-'} Tahun · <span className="text-emerald-700">{kepegawaian.generation || '-'}</span>
                            </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Tempat, Tanggal Lahir</span>
                            <span className="font-bold text-slate-800 text-right">
                                {pribadi.birth_place ? `${pribadi.birth_place}, ` : ''}{pribadi.birth_date || '-'}
                            </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Jenis Kelamin</span>
                            <span className="font-bold text-slate-800 text-right">{pribadi.gender || '-'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Agama</span>
                            <span className="font-bold text-slate-800 text-right">{pribadi.religion || '-'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Status Pernikahan</span>
                            <span className="font-bold text-slate-800 text-right">{pribadi.marital_status || '-'}</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-slate-400 font-medium">Status Pajak (PTKP)</span>
                            <span className="font-bold text-slate-800 text-right">{pribadi.ptkp || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CARD 4: RIWAYAT & AKUMULASI PELATIHAN (OPSI B: MURNI DATA REAL TANPA DUMMY TARGET) */}
            <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-emerald-50 text-[#004D40] border border-emerald-100 flex items-center justify-center">
                            <GraduationCap size={15} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight">
                                Riwayat &amp; Akumulasi Pelatihan
                            </h3>
                            <p className="text-[11px] text-slate-500">
                                Rekapitulasi jam belajar dan program pelatihan yang pernah diikuti staf
                            </p>
                        </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Sparkles size={12} />
                        <span>{pelatihan.length > 0 ? `${pelatihan_total_jam} Jam Belajar Tercatat` : 'Belum Ada Jam Pelatihan'}</span>
                    </span>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/80 p-3.5 rounded-lg border border-slate-200/80">
                    {/* Total Jam Pelatihan */}
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#004D40] flex items-center justify-center shrink-0">
                            <Clock size={18} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Jam Pelatihan</span>
                            <p className="text-base font-black text-slate-900 mt-0.5">
                                {Number(pelatihan_total_jam).toFixed(1)} <span className="text-xs font-bold text-slate-500">Jam</span>
                            </p>
                        </div>
                    </div>

                    {/* Program Diikuti */}
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                            <BookOpen size={18} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Program Diikuti</span>
                            <p className="text-base font-black text-slate-900 mt-0.5">
                                {pelatihan.length} <span className="text-xs font-bold text-slate-500">Pelatihan</span>
                            </p>
                        </div>
                    </div>

                    {/* Rata-rata Durasi */}
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                            <Activity size={18} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rata-rata Durasi</span>
                            <p className="text-base font-black text-slate-900 mt-0.5">
                                {pelatihan.length > 0 ? (pelatihan_total_jam / pelatihan.length).toFixed(1) : '0.0'} <span className="text-xs font-bold text-slate-500">Jam/Pelatihan</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Table of Completed Trainings */}
                <div>
                    <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Riwayat Program Pelatihan yang Pernah Diikuti
                    </h4>
                    
                    {pelatihan.length > 0 ? (
                        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-2xs">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                                    <tr>
                                        <th className="px-3.5 py-2">Nama Program Pelatihan</th>
                                        <th className="px-3.5 py-2 text-center">Periode</th>
                                        <th className="px-3.5 py-2 text-center">Durasi</th>
                                        <th className="px-3.5 py-2">Penyelenggara / Instruktur</th>
                                        <th className="px-3.5 py-2 text-center">Kategori</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {pelatihan.map((p, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-3.5 py-2 font-bold text-slate-900">{p.name}</td>
                                            <td className="px-3.5 py-2 text-center font-mono text-slate-600">{p.month_year || '-'}</td>
                                            <td className="px-3.5 py-2 text-center font-bold text-emerald-800">{p.hours} Jam</td>
                                            <td className="px-3.5 py-2 text-slate-600">{p.provider || '-'}</td>
                                            <td className="px-3.5 py-2 text-center">
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px]">
                                                    {p.regularity || 'Reguler'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-slate-50/70 rounded-lg p-5 text-center border border-dashed border-slate-200 text-slate-500">
                            <GraduationCap size={24} className="mx-auto text-slate-400 mb-1.5 opacity-60" />
                            <p className="text-xs font-semibold text-slate-700">Belum Ada Riwayat Pelatihan</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Karyawan ini belum memiliki catatan jam pelatihan di database pelatihan.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
