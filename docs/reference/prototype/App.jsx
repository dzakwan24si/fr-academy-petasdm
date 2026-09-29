import { useState } from 'react';
import MapViewer from './components/MapViewer';
import SidebarDetail from './components/SidebarDetail';
import DashboardView from './components/DashboardView';
import EmployeesView from './components/EmployeesView';
import AnalyticsView from './components/AnalyticsView';
import ReportsView from './components/ReportsView';
import ToolsView from './components/ToolsView';
import { companies, employees } from './data/mockData';
import logo from './assets/logofr.png'; // Logo perusahaan
import { LayoutDashboard, Map, Wallet, Clock, PieChart, Users, Settings, HelpCircle, Bell, HeadphonesIcon, Plus, ArrowLeft } from 'lucide-react';

function App() {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' atau 'map'

  const handleMarkerClick = (company) => {
    setSelectedCompany(company);
  };

  const handleCloseSidebar = () => {
    setSelectedCompany(null);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#F7F8FA] flex flex-col font-sans p-5">
      
      {/* Top Floating Row */}
      <div className="flex justify-between items-center w-full mb-5 shrink-0 px-2">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 w-64">
          <img src={logo} alt="Logo" className="h-10 drop-shadow-sm" />
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none pt-1">Peta SDM FR</h1>
        </div>

        {/* Center: Pill Navigation */}
        <div className="flex bg-white p-1 rounded-full items-center shadow-sm">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              currentView === 'dashboard' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setCurrentView('map')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              currentView === 'map' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Peta Operasional
          </button>
          <button 
            onClick={() => setCurrentView('reports')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              currentView === 'reports' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Laporan
          </button>
          <button 
            onClick={() => setCurrentView('tools')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              currentView === 'tools' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Alat
          </button>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-5 w-64 justify-end">
          <button className="text-gray-400 hover:text-gray-900 transition-colors"><HeadphonesIcon size={20} /></button>
          <button className="text-gray-400 hover:text-gray-900 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="w-9 h-9 rounded-full bg-corporate-dark overflow-hidden border-2 border-white shadow-sm">
            <img src="https://ui-avatars.com/api/?name=Admin&background=045b4a&color=fff" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 w-full flex overflow-hidden gap-5">
        
        {/* Floating Thin Left Sidebar */}
        <aside className="w-[72px] bg-white rounded-3xl flex flex-col items-center py-6 shadow-sm shrink-0">
          
          {/* Top Main Modules */}
          <div className="flex flex-col gap-6 w-full items-center">
            
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${currentView === 'dashboard' ? 'bg-gray-900 text-white shadow-md scale-110' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`} 
              title="Dashboard"
            >
              <LayoutDashboard size={18} />
            </button>
            
            <button 
              onClick={() => setCurrentView('employees')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${currentView === 'employees' ? 'bg-gray-900 text-white shadow-md scale-110' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`} 
              title="Direktori Karyawan"
            >
              <Users size={20} />
            </button>
            
            <button 
              onClick={() => setCurrentView('analytics')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${currentView === 'analytics' ? 'bg-gray-900 text-white shadow-md scale-110' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`} 
              title="Analitik Lanjutan"
            >
              <PieChart size={20} />
            </button>

          </div>

          <div className="mt-auto flex flex-col gap-6 w-full items-center">
            <button className="text-gray-900 w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"><Settings size={20} /></button>
            <button className="text-gray-400 hover:text-gray-600 transition-colors"><HelpCircle size={22} /></button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex overflow-hidden relative z-0">
          {currentView === 'dashboard' ? (
            <DashboardView employees={employees} companies={companies} />
          ) : currentView === 'employees' ? (
            <EmployeesView employees={employees} companies={companies} />
          ) : currentView === 'analytics' ? (
            <AnalyticsView employees={employees} companies={companies} />
          ) : currentView === 'reports' ? (
            <ReportsView />
          ) : currentView === 'tools' ? (
            <ToolsView />
          ) : (
            <div className="flex-1 flex gap-5 overflow-hidden">
              {/* Left Column: Map Area */}
              <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden relative">
                {/* Map Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 z-10 relative">
                  <h2 className="text-lg font-bold text-gray-800">
                    Indonesia <span className="text-gray-400 font-normal">/ {selectedCompany ? selectedCompany.region : 'Semua Region'}</span>
                  </h2>
                  <div className="flex items-center text-xs font-medium text-gray-500 gap-4">
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-corporate-light mr-1.5"></span> Provinsi</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-400 mr-1.5"></span> Lokasi Perusahaan</span>
                  </div>
                </div>
                
                {/* Map Container */}
                <div className="flex-1 relative z-0">
                  <MapViewer onMarkerClick={handleMarkerClick} selectedCompany={selectedCompany} />
                </div>
              </div>

              {/* Right Column: Sidebar / Panel */}
              <div className="w-[420px] bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col shrink-0 overflow-hidden relative">
                <SidebarDetail 
                  company={selectedCompany} 
                  onClose={handleCloseSidebar}
                  onSelectCompany={setSelectedCompany}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
