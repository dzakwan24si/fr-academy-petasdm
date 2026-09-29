import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, MapPin, Briefcase, Award, Clock, Plus } from 'lucide-react';

export default function StaffDetailModal({ staff, onClose }) {
  // Local state untuk demonstrasi UI yang bisa diedit sementara
  const [formData, setFormData] = useState(null);

  // Sync state ketika staff berubah
  useEffect(() => {
    if (staff) {
      setFormData({
        ...staff,
        // Inisialisasi properti opsional jika belum ada
        nik: staff.nik || '',
        targetPosisi: staff.targetPosisi || '',
        lokasiPenugasan: staff.lokasiPenugasan || '',
        statusPenugasan: staff.statusPenugasan || '',
        region: staff.region || 'Riau',
        historiPekerjaan: staff.historiPekerjaan || [],
        prestasi: staff.prestasi || [],
        kompetensi: staff.kompetensi || [],
        progressIDP: staff.progressIDP || 0
      });
    }
  }, [staff]);

  if (!staff || !formData) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Di aplikasi nyata, ini akan call API. Di sini cukup alert/feedback visual
    alert(`Perubahan untuk ${formData.nama} berhasil disimpan sementara di memori browser!`);
  };

  const handleAddHistori = () => {
    const newEntry = prompt("Masukkan histori pekerjaan baru (format: Waktu: Deskripsi):", "Okt 2026 - Sekarang: Promosi Askep");
    if (newEntry) {
      setFormData(prev => ({ ...prev, historiPekerjaan: [newEntry, ...prev.historiPekerjaan] }));
    }
  };

  const handleAddPrestasi = () => {
    const newEntry = prompt("Masukkan prestasi baru:", "Pencapaian target tahunan 120%");
    if (newEntry) {
      setFormData(prev => ({ ...prev, prestasi: [newEntry, ...prev.prestasi] }));
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6" 
      style={{ zIndex: 9999 }}
    >
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row transform transition-all overflow-hidden">
        
        {/* Left Side: Editable Profile Info */}
        <div className="w-full md:w-[400px] bg-gray-50 p-8 border-r border-gray-200 flex flex-col items-center shrink-0 overflow-y-auto custom-scrollbar">
          
          {/* Breadcrumb Header */}
          <div className="w-full mb-6">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider text-left">
              PT Ciliandra Perkasa / {formData.nama.split(' ')[0]}
            </p>
          </div>

          {/* Foto Profil */}
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-[2rem] overflow-hidden bg-corporate-dark text-white flex items-center justify-center text-3xl font-bold shadow-lg">
              {formData.foto ? (
                <img src={formData.foto} alt={formData.nama} className="w-full h-full object-cover" />
              ) : (
                formData.nama.substring(0,2).toUpperCase()
              )}
            </div>
          </div>
          
          <h2 className="text-xl font-extrabold text-gray-900 mb-1 text-center">{formData.nama}</h2>
          <p className="text-gray-500 font-medium mb-6 text-sm text-center">ID: {formData.nik || 'Belum diisi'}</p>

          {/* Form Inputs */}
          <div className="w-full space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Nama Lengkap</label>
              <input 
                type="text" 
                value={formData.nama} 
                onChange={(e) => handleInputChange('nama', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-corporate-light focus:border-corporate-light font-medium text-gray-800 text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">ID Karyawan</label>
              <input 
                type="text" 
                value={formData.nik} 
                onChange={(e) => handleInputChange('nik', e.target.value)}
                placeholder="Contoh: 2026010001"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-corporate-light focus:border-corporate-light font-medium text-gray-800 text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Jabatan Saat Ini</label>
              <input 
                type="text" 
                value={formData.jabatan} 
                onChange={(e) => handleInputChange('jabatan', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-corporate-light focus:border-corporate-light font-medium text-gray-800 text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Target Jabatan</label>
              <input 
                type="text" 
                value={formData.targetPosisi} 
                onChange={(e) => handleInputChange('targetPosisi', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-corporate-light focus:border-corporate-light font-medium text-gray-800 text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Lokasi OJT / Penempatan</label>
              <input 
                type="text" 
                value={formData.lokasiPenugasan} 
                onChange={(e) => handleInputChange('lokasiPenugasan', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-corporate-light focus:border-corporate-light font-medium text-gray-800 text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Status OJT</label>
              <select 
                value={formData.statusPenugasan}
                onChange={(e) => handleInputChange('statusPenugasan', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-corporate-light focus:border-corporate-light font-medium text-gray-800 text-sm transition-all"
              >
                <option value="Belum Penugasan">Belum Penugasan</option>
                <option value="Sedang OJT">Sedang OJT</option>
                <option value="Sudah Penugasan">Sudah Penugasan</option>
                <option value="Definitif">Definitif</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Region</label>
              <input 
                type="text" 
                value={formData.region} 
                onChange={(e) => handleInputChange('region', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-corporate-light focus:border-corporate-light font-medium text-gray-800 text-sm transition-all"
              />
            </div>
          </div>

          <div className="mt-8 w-full pb-8">
            <button 
              onClick={handleSave}
              className="w-full py-3.5 bg-orange-400 hover:bg-orange-500 text-white font-bold rounded-xl shadow-md transition-colors"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>

        {/* Right Side: Dashboard Details */}
        <div className="flex-1 p-8 relative overflow-y-auto custom-scrollbar bg-white">
          <div className="absolute top-6 right-6 z-10 flex items-center gap-4">
            <button 
              onClick={onClose}
              className="flex items-center text-gray-400 hover:text-gray-700 font-bold transition-colors"
            >
              <X size={20} strokeWidth={2.5} className="mr-1" /> Tutup
            </button>
          </div>
          
          {/* Section: Progress IDP */}
          <div className="mb-10 mt-6 bg-corporate-dark p-6 rounded-3xl border border-corporate-dark/80 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-20 -translate-y-20 pointer-events-none"></div>
            
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-6 relative z-10">
              PROGRESS IDP (INDIVIDUAL DEVELOPMENT PLAN)
            </h3>
            
            <div className="flex flex-wrap items-center gap-8 relative z-10">
              {/* Overall Progress (Besar) */}
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                    <circle 
                      cx="50" cy="50" r="45" fill="none" stroke="#4ade80" strokeWidth="8" 
                      strokeDasharray={`${formData.progressIDP * 2.83} 283`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute text-white font-extrabold text-3xl">
                    {formData.progressIDP}%
                  </div>
                </div>
                <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider mt-3">Overall Progress</span>
              </div>

              {/* Sub-progress (Kecil) */}
              {['Refreshment', 'Soft Skill', 'OJT Task'].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                      {formData.progressIDP > 0 && (
                        <circle 
                          cx="50" cy="50" r="40" fill="none" stroke="#94a3b8" strokeWidth="8" 
                          strokeDasharray={`${(formData.progressIDP / 1.5) * 2.51} 251`}
                        />
                      )}
                    </svg>
                    <div className="absolute text-white font-bold text-sm">
                      {formData.progressIDP > 0 ? Math.round(formData.progressIDP / 1.5) : '0'}%
                    </div>
                  </div>
                  <span className="text-[10px] text-white/70 font-bold mt-2 text-center w-16 leading-tight">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Histori Pekerjaan */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
              <h4 className="font-extrabold text-gray-800 text-lg">Histori Pekerjaan</h4>
              <button onClick={handleAddHistori} className="text-xs font-bold text-corporate-light hover:text-green-700 flex items-center bg-green-50 px-3 py-1.5 rounded-full transition-colors">
                <Plus size={14} className="mr-1" /> Tambah
              </button>
            </div>
            {formData.historiPekerjaan.length > 0 ? (
              <div className="space-y-4 border-l-2 border-gray-100 ml-2 pl-6 py-2">
                {formData.historiPekerjaan.map((histori, index) => {
                  const parts = histori.split(':');
                  const waktu = parts[0];
                  const deskripsi = parts.slice(1).join(':').trim() || histori;
                  return (
                    <div key={index} className="relative">
                      <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-corporate-light ring-4 ring-white shadow-sm"></span>
                      <p className="text-xs font-bold text-gray-500 mb-0.5">{waktu}</p>
                      <p className="text-sm text-gray-800 font-medium">{deskripsi}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Belum ada histori pekerjaan.</p>
            )}
          </div>

          {/* Section: Achievement & Prestasi */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
              <h4 className="font-extrabold text-gray-800 text-lg">Achievement & Prestasi</h4>
              <button onClick={handleAddPrestasi} className="text-xs font-bold text-corporate-light hover:text-green-700 flex items-center bg-green-50 px-3 py-1.5 rounded-full transition-colors">
                <Plus size={14} className="mr-1" /> Tambah
              </button>
            </div>
            {formData.prestasi.length > 0 ? (
              <div className="space-y-3">
                {formData.prestasi.map((prestasi, index) => (
                  <div key={index} className="flex items-start bg-yellow-50 p-4 rounded-2xl border border-yellow-100/50">
                    <div className="bg-white p-1.5 rounded-full shadow-sm mr-3 shrink-0">
                      <Award size={16} className="text-yellow-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-800 pt-0.5">{prestasi}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Belum ada achievement/prestasi.</p>
            )}
          </div>

          {/* Section: Kompetensi Talent */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
              <h4 className="font-extrabold text-gray-800 text-lg">Kompetensi Talent</h4>
              <button className="text-xs font-bold text-corporate-light hover:text-green-700 flex items-center bg-green-50 px-3 py-1.5 rounded-full transition-colors">
                <Plus size={14} className="mr-1" /> Tambah
              </button>
            </div>
            <p className="text-sm text-gray-400 italic">Belum ada data kompetensi.</p>
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
