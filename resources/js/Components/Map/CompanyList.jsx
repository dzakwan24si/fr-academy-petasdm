import { useState } from 'react';
import { Search } from 'lucide-react';

export function CompanyList({ companies, locations, totalLocations, selectedLocation, onSelectCompany }) {
    const [search, setSearch] = useState('');

    const filtered = companies.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.region.toLowerCase().includes(search.toLowerCase())
    );

    // Group by region
    const grouped = filtered.reduce((acc, c) => {
        const r = c.region || 'Lainnya';
        if (!acc[r]) acc[r] = [];
        acc[r].push(c);
        return acc;
    }, {});

    const totalHc = filtered.reduce((sum, c) => sum + (c.employee_count === '<5' ? 0 : parseInt(c.employee_count) || 0), 0);

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Cari perusahaan, lokasi, atau region..." 
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-corporate-light focus:border-corporate-light outline-none"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-4 text-sm text-gray-600">
                    <div><span className="font-bold text-gray-900">{totalHc.toLocaleString()}</span> HC</div>
                    <div><span className="font-bold text-gray-900">{filtered.length}</span> Perusahaan</div>
                    <div><span className="font-bold text-gray-900">{totalLocations}</span> Lokasi</div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {Object.keys(grouped).sort().map(region => (
                    <div key={region}>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            {region}
                        </h3>
                        <div className="space-y-2">
                            {grouped[region].map(c => (
                                <button 
                                    key={c.id}
                                    onClick={() => onSelectCompany(c.id)}
                                    className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-corporate-light hover:bg-gray-50 transition-colors"
                                >
                                    <div className="font-bold text-corporate-dark">{c.code} - {c.name}</div>
                                    <div className="text-sm text-gray-500 mt-1 flex justify-between">
                                        <span>HC: {c.employee_count}</span>
                                        <span>{c.location_count} Lokasi</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
