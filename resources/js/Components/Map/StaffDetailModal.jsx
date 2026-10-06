import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import EmployeeAvatar from '@/Components/EmployeeAvatar';


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
        <div className="fixed inset-0 bg-black/60 z-[99999] flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
                 onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">Detail Karyawan</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-2 text-xl leading-none">&times;</button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="text-center py-10">Memuat detail...</div>
                    ) : error ? (
                        <div className="text-center py-10 text-red-500">{error}</div>
                    ) : detail && (
                        <div className="space-y-8">
                            {/* Prominent Header Card with Avatar */}
                            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 shadow-md relative overflow-hidden">
                                <div className="relative group shrink-0">
                                    <EmployeeAvatar 
                                        name={detail.identitas.name} 
                                        photoUrl={detail.identitas.photo_url} 
                                        size="xl" 
                                        className="ring-4 ring-white/30 shadow-lg"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[11px] font-medium p-1"
                                        title="Ubah Foto Profil"
                                    >
                                        <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
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

                                <div className="flex-1 text-center sm:text-left space-y-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                        <h3 className="text-xl font-bold tracking-tight text-amber-400">{detail.identitas.name}</h3>
                                        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                                className="bg-white/10 hover:bg-white/20 text-white text-xs px-2.5 py-1 rounded-lg border border-white/20 transition-colors flex items-center space-x-1"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                                <span>{uploading ? 'Mengunggah...' : 'Upload Foto'}</span>
                                            </button>
                                            {detail.identitas.photo_url && (
                                                <button
                                                    type="button"
                                                    onClick={handleDeletePhoto}
                                                    disabled={uploading}
                                                    className="bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs px-2 py-1 rounded-lg border border-red-400/30 transition-colors"
                                                    title="Hapus Foto Profil"
                                                >
                                                    Hapus
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-300">{detail.identitas.job}</p>
                                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
                                        <span className="bg-slate-800/80 px-2.5 py-0.5 rounded text-amber-300 font-mono">ID: {detail.identitas.employee_id}</span>
                                        <span>•</span>
                                        <span>{detail.identitas.company}</span>
                                        <span>•</span>
                                        <span>{detail.identitas.location}</span>
                                    </div>

                                    {uploadMsg && (
                                        <div className={`mt-2 text-xs p-1.5 rounded ${uploadMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                                            {uploadMsg.text}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <section>
                                <h3 className="font-bold text-corporate-dark border-b pb-2 mb-4">Identitas & Organisasi</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-gray-500 block">Nama Lengkap</span> <span className="font-medium">{detail.identitas.name}</span></div>
                                    <div><span className="text-gray-500 block">Employee ID / NIK</span> <span className="font-medium">{detail.identitas.employee_id}</span></div>
                                    <div><span className="text-gray-500 block">Jabatan</span> <span className="font-medium">{detail.identitas.job}</span></div>
                                    <div><span className="text-gray-500 block">Level</span> <span className="font-medium">{detail.identitas.level}</span></div>
                                    <div><span className="text-gray-500 block">Departemen</span> <span className="font-medium">{detail.identitas.dept}</span></div>
                                    <div><span className="text-gray-500 block">Perusahaan</span> <span className="font-medium">{detail.identitas.company}</span></div>
                                    <div><span className="text-gray-500 block">Lokasi</span> <span className="font-medium">{detail.identitas.location}</span></div>
                                    <div><span className="text-gray-500 block">Region</span> <span className="font-medium">{detail.identitas.region}</span></div>
                                </div>
                            </section>

                            <section>
                                <h3 className="font-bold text-corporate-dark border-b pb-2 mb-4">Data Pribadi (Sensitif)</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-gray-500 block">Jenis Kelamin</span> <span className="font-medium">{detail.pribadi.gender}</span></div>
                                    <div><span className="text-gray-500 block">Agama</span> <span className="font-medium">{detail.pribadi.religion}</span></div>
                                    <div><span className="text-gray-500 block">Tempat, Tanggal Lahir</span> <span className="font-medium">{detail.pribadi.birth_place}, {detail.pribadi.birth_date}</span></div>
                                    <div><span className="text-gray-500 block">Umur</span> <span className="font-medium">{detail.pribadi.age} Tahun</span></div>
                                    <div><span className="text-gray-500 block">Status Pernikahan</span> <span className="font-medium">{detail.pribadi.marital_status}</span></div>
                                    <div><span className="text-gray-500 block">PTKP Pajak</span> <span className="font-medium">{detail.pribadi.ptkp}</span></div>
                                </div>
                            </section>

                            <section>
                                <h3 className="font-bold text-corporate-dark border-b pb-2 mb-4">Kepegawaian</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-gray-500 block">Tanggal Masuk</span> <span className="font-medium">{detail.kepegawaian.join_date}</span></div>
                                    <div><span className="text-gray-500 block">Masa Kerja</span> <span className="font-medium">{detail.kepegawaian.los} Tahun</span></div>
                                    <div><span className="text-gray-500 block">Tipe Karyawan</span> <span className="font-medium">{detail.kepegawaian.employment_type}</span></div>
                                    <div><span className="text-gray-500 block">Generasi</span> <span className="font-medium">{detail.kepegawaian.generation}</span></div>
                                    <div className="col-span-2">
                                        <span className="text-gray-500 block">Status Pensiun</span> 
                                        <span className={`font-medium ${detail.kepegawaian.retire_risk ? 'text-red-600' : 'text-green-600'}`}>
                                            {detail.kepegawaian.retire_risk ? 'Telah/Akan segera memasuki usia pensiun' : 'Masih aktif'} (Estimasi pensiun usia 55: {detail.kepegawaian.retire_date})
                                        </span>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="font-bold text-corporate-dark border-b pb-2 mb-4">Riwayat Pelatihan</h3>
                                {detail.pelatihan.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left border">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="p-2 border-r">Waktu</th>
                                                    <th className="p-2 border-r">Nama Pelatihan</th>
                                                    <th className="p-2 border-r">Intruktur</th>
                                                    <th className="p-2 border-r">Jenis Program</th>
                                                    <th className="p-2">Jam</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detail.pelatihan.map((p, i) => (
                                                    <tr key={i} className="border-b">
                                                        <td className="p-2 border-r whitespace-nowrap">{p.month_year}</td>
                                                        <td className="p-2 border-r">{p.name}</td>
                                                        <td className="p-2 border-r">{p.provider}</td>
                                                        <td className="p-2 border-r">{p.regularity}</td>
                                                        <td className="p-2 text-center">{p.hours}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-gray-50 font-bold">
                                                    <td colSpan="4" className="p-2 text-right border-r">Total Jam Pelatihan:</td>
                                                    <td className="p-2 text-center">{detail.pelatihan_total_jam}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded text-center">
                                        Belum ada catatan pelatihan yang terhubung ke karyawan ini.
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );

}
