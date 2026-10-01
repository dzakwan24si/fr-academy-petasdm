import { useState, useEffect } from 'react';
import axios from 'axios';

export function StaffDetailModal({ employeeId, onClose }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    return (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex justify-center items-center p-4">
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
                                                    <th className="p-2 border-r">Reguler?</th>
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
        </div>
    );
}
