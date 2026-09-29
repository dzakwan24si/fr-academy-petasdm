import { useState } from 'react';
import { X, Search, Users, MapPin, Briefcase, ChevronLeft, Plus } from 'lucide-react';
import { companies, employees } from '../data/mockData';
import StaffDetailModal from './StaffDetailModal';

export default function SidebarDetail({ company, onClose, onSelectCompany }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [activeTab, setActiveTab] = useState('Staff'); // 'Profil' atau 'Staff'
  const [activeFilter, setActiveFilter] = useState(''); // State untuk filter cepat

  // KONDISI 1: JIKA BELUM ADA PERUSAHAAN YANG DIPILIH
  if (!company) {
    const groupedCompanies = companies.reduce((acc, curr) => {
      acc[curr.region] = acc[curr.region] || [];
      acc[curr.region].push(curr);
      return acc;
    }, {});

    return (
      <div className="w-full h-full flex flex-col bg-white">
        <div className="p-6 border-b border-gray-100 shrink-0">
          <div className="relative group">
            <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-corporate-light transition-colors" />
            <input
              type="text"
              placeholder="Cari perusahaan atau kabupaten..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-corporate-light/20 focus:border-corporate-light text-sm font-medium transition-all duration-300"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Semua Provinsi</p>
          {Object.entries(groupedCompanies).map(([region, comps]) => (
            <div key={region} className="mb-6">
              {comps.map((c) => (
                <div 
                  key={c.id} 
                  onClick={() => onSelectCompany(c)}
                  className="mb-4 group cursor-pointer p-3 -mx-3 rounded-xl hover:bg-green-50 transition-colors"
                >
                  <div className="flex items-center text-xs font-bold text-corporate-light mb-1 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2"></span> {region}
                  </div>
                  <h4 className="font-extrabold text-gray-800 text-base group-hover:text-corporate-dark transition-colors">{c.name}</h4>
                  <p className="text-sm text-gray-500 font-medium">{c.kabupaten || 'Area Operasi'}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // KONDISI 2: PERUSAHAAN TERPILIH
  const companyStaff = employees.filter((emp) => emp.companyId === company.id);
  const filteredStaff = companyStaff.filter((emp) => {
    const matchesSearch = emp.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.jabatan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter ? emp.jabatan.toLowerCase().includes(activeFilter.toLowerCase()) : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <div className="w-full h-full flex flex-col bg-white">
        
        {/* Header Panel dengan Background Image */}
        <div 
          className="relative text-white p-6 overflow-hidden shrink-0"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0,77,64,0.95), rgba(0,77,64,0.85)), url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
          
          <button 
            onClick={onClose}
            className="flex items-center text-white/70 hover:text-white text-sm font-medium mb-4 transition-colors z-10 relative"
          >
            <ChevronLeft size={16} className="mr-1" /> Kembali ke daftar
          </button>
          
          <h2 className="text-2xl font-extrabold mb-1 pr-4 leading-tight relative z-10">{company.name}</h2>
          <p className="text-sm text-white/90 font-medium mb-4 relative z-10 shadow-sm">
            {company.kabupaten || 'Area Operasi'} &bull; {company.region}
          </p>
          
          <div className="flex flex-wrap gap-2 relative z-10">
            {(company.fasilitas || []).map((fas, i) => (
              <span key={i} className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white shadow-sm border border-white/20">
                {fas}
              </span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0 px-2">
          <button 
            onClick={() => setActiveTab('Profil')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'Profil' ? 'border-corporate-light text-corporate-dark' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Profil
          </button>
          <button 
            onClick={() => setActiveTab('Staff')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'Staff' ? 'border-corporate-light text-corporate-dark' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Staff (SDM)
          </button>
        </div>

        {/* Tab Content: Profil */}
        {activeTab === 'Profil' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Deskripsi</p>
              <p className="text-gray-700 font-medium leading-relaxed">{company.description}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Provinsi</p>
              <p className="text-gray-800 font-bold">{company.region}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Kabupaten / Area Operasi</p>
              <p className="text-gray-800 font-bold">{company.kabupaten}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Fasilitas</p>
              <p className="text-gray-800 font-bold">{(company.fasilitas || []).join(', ')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Koordinat Acuan</p>
              <p className="text-gray-800 font-bold font-mono">{company.coordinates[0].toFixed(4)}&deg;, {company.coordinates[1].toFixed(4)}&deg;</p>
            </div>
          </div>
        )}

        {/* Tab Content: Staff */}
        {activeTab === 'Staff' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 pb-2 shrink-0">
              <div className="flex gap-2 mb-4">
                <div className="relative group flex-1">
                  <input
                    type="text"
                    placeholder="Cari nama staff..."
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-corporate-light/20 focus:border-corporate-light text-sm font-medium transition-all duration-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="bg-corporate-light hover:bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center shadow-sm transition-colors">
                  <Plus size={16} className="mr-1" /> Tambah
                </button>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2 mb-2">
                {['Manager', 'Askep', 'Asisten', 'Mandor'].map((f) => (
                  <button 
                    key={f} 
                    onClick={() => setActiveFilter(activeFilter === f ? '' : f)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                      activeFilter === f 
                        ? 'bg-corporate-dark text-white shadow-md' 
                        : 'text-corporate-dark bg-corporate-light/10 hover:bg-corporate-light/20'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 space-y-3 custom-scrollbar">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => (
                  <div 
                    key={staff.id} 
                    onClick={() => setSelectedStaff(staff)}
                    className="group bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-corporate-light/30 transition-all duration-300 cursor-pointer flex items-center gap-4"
                  >
                    {staff.foto ? (
                      <img src={staff.foto} alt={staff.nama} className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-100" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-corporate-dark text-white flex items-center justify-center font-bold shrink-0">
                        {staff.nama.substring(0,2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 group-hover:text-corporate-dark transition-colors">{staff.nama}</h3>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">{staff.jabatan}</p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      staff.status === 'Aktif' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {staff.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-sm font-medium">Tidak ada staf ditemukan.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <StaffDetailModal staff={selectedStaff} onClose={() => setSelectedStaff(null)} />
    </>
  );
}
