import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';

export function FilterBar({ availableFilters }) {
    const { filters } = usePage().props;
    const [localFilters, setLocalFilters] = useState(filters || {});

    const apply = () => {
        router.get(route(route().current()), localFilters, { preserveState: true, preserveScroll: true });
    };

    const reset = () => {
        setLocalFilters({});
        router.get(route(route().current()), {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <div className="bg-white p-4 rounded shadow mb-4 flex gap-4 flex-wrap items-end">
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Region</label>
                <select 
                    className="border p-2 rounded text-sm w-40"
                    value={localFilters.region || ''}
                    onChange={e => setLocalFilters({...localFilters, region: e.target.value})}
                >
                    <option value="">Semua</option>
                    <option value="Sumatera">Sumatera</option>
                    <option value="Kalimantan">Kalimantan</option>
                    <option value="Riau">Riau</option>
                    <option value="Kalbar">Kalbar</option>
                    <option value="Kaltim">Kaltim</option>
                </select>
            </div>
            {/* Add more filters similarly: Group, Company, Location, Dept, Level, Emp Type, Gen, Gender */}
            <div>
                <button onClick={apply} className="bg-corporate-light text-white px-4 py-2 rounded text-sm font-bold mr-2">Terapkan</button>
                <button onClick={reset} className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-bold">Reset</button>
            </div>
        </div>
    );
}
