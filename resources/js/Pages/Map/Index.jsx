import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { SdmMap } from '@/Components/Map/SdmMap';
import { CompanyPanel } from '@/Components/Map/CompanyPanel';
import { CompanyList } from '@/Components/Map/CompanyList';

export default function MapIndex() {
    const [locations, setLocations] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [selectedLocationId, setSelectedLocationId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [totalLocations, setTotalLocations] = useState(0);
    
    useEffect(() => {
        Promise.all([
            axios.get('/data/map/locations'),
            axios.get('/data/companies')
        ]).then(([locRes, compRes]) => {
            setLocations(locRes.data);
            setCompanies(compRes.data.data);
            setTotalLocations(compRes.data.total_locations);
            setLoading(false);
        });
    }, []);

    const selectedCompany = selectedCompanyId ? companies.find(c => c.id === selectedCompanyId) : null;
    const selectedLocation = selectedLocationId ? locations.find(l => l.id === selectedLocationId) : null;

    const noCoordCount = locations.filter(l => !l.latitude || !l.longitude).length;

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-app-bg overflow-hidden relative">
            <Head title="Peta Perusahaan" />
            
            <div className="flex-1 relative z-0">
                <SdmMap 
                    locations={locations} 
                    selectedCompanyId={selectedCompanyId}
                    selectedLocationId={selectedLocationId}
                    onSelectLocation={(locId, singleCompanyId) => {
                        setSelectedLocationId(locId);
                        if (singleCompanyId) setSelectedCompanyId(singleCompanyId);
                    }}
                />
                
                {noCoordCount > 0 && (
                    <div className="absolute top-4 right-4 bg-orange-100 border border-orange-300 text-orange-800 px-3 py-2 rounded-lg shadow-sm z-[1000]">
                        <p className="text-sm font-medium">{noCoordCount} lokasi belum punya koordinat</p>
                    </div>
                )}
            </div>

            <div className="w-full lg:w-[420px] bg-panel-bg shadow-[-4px_0_15px_rgba(0,0,0,0.05)] z-10 flex flex-col transition-transform duration-300">
                {selectedCompany ? (
                    <CompanyPanel 
                        company={selectedCompany} 
                        location={selectedLocation}
                        onBack={() => {
                            setSelectedCompanyId(null);
                            setSelectedLocationId(null);
                        }} 
                        onLocationSelect={setSelectedLocationId}
                    />
                ) : (
                    <CompanyList 
                        companies={companies} 
                        locations={locations}
                        totalLocations={totalLocations}
                        selectedLocation={selectedLocation}
                        onSelectCompany={setSelectedCompanyId}
                    />
                )}
            </div>
        </div>
    );
}
