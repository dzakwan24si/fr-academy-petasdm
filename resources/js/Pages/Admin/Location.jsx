import { useState } from 'react';
import { Head, usePage, router, useForm } from '@inertiajs/react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LeafletIcon } from '@/Components/LeafletIcon'; // Custom icon to avoid default image issue

function MiniMap({ lat, lng, onChange }) {
    const defaultCenter = [ -2.5, 118.0 ]; // Center of Indonesia
    const center = (lat && lng) ? [lat, lng] : defaultCenter;

    function LocationMarker() {
        useMapEvents({
            click(e) {
                onChange(e.latlng.lat, e.latlng.lng);
            },
        });

        return lat && lng ? (
            <Marker position={[lat, lng]} icon={LeafletIcon} />
        ) : null;
    }

    return (
        <MapContainer center={center} zoom={4} className="h-64 w-full rounded-md z-0">
            <TileLayer
                url={import.meta.env.VITE_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                attribution={import.meta.env.VITE_MAP_ATTRIBUTION || '&copy; OpenStreetMap contributors'}
            />
            <LocationMarker />
        </MapContainer>
    );
}

export default function LocationAdmin({ locations }) {
    const { flash, errors: pageErrors } = usePage().props;
    const [selectedLoc, setSelectedLoc] = useState(null);
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        latitude: '',
        longitude: ''
    });

    const [importFile, setImportFile] = useState(null);

    const openEdit = (loc) => {
        setSelectedLoc(loc);
        setData({ latitude: loc.latitude || '', longitude: loc.longitude || '' });
        clearErrors();
    };

    const submitEdit = (e) => {
        e.preventDefault();
        post(`/admin/lokasi/${selectedLoc.id}`, {
            onSuccess: () => setSelectedLoc(null),
        });
    };

    const [previewData, setPreviewData] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setImportFile(file);
        if (!file) {
            setPreviewData(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length > 0) {
                const header = lines[0].split(';');
                const codeIdx = header.indexOf('code');
                const latIdx = header.indexOf('latitude');
                const lngIdx = header.indexOf('longitude');
                
                if (codeIdx > -1 && latIdx > -1 && lngIdx > -1) {
                    const previews = lines.slice(1, 6).map(line => {
                        const cols = line.split(';');
                        return {
                            code: cols[codeIdx],
                            lat: cols[latIdx],
                            lng: cols[lngIdx]
                        };
                    });
                    setPreviewData({
                        total: lines.length - 1,
                        rows: previews
                    });
                }
            }
        };
        reader.readAsText(file);
    };

    const submitImport = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('file', importFile);
        router.post('/admin/lokasi-import', formData, {
            forceFormData: true,
            onSuccess: () => {
                setImportFile(null);
                setPreviewData(null);
            }
        });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <Head title="Koordinat Lokasi" />
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-corporate-dark">Koordinat Lokasi</h1>
            </div>

            {flash?.success && <div className="bg-green-100 p-4 rounded text-green-800">{flash.success}</div>}
            {flash?.warning && <div className="bg-orange-100 p-4 rounded text-orange-800">{flash.warning}</div>}
            {pageErrors.file && <div className="bg-red-100 p-4 rounded text-red-800">{pageErrors.file}</div>}

            <div className="bg-white p-6 rounded-2xl shadow border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">Impor CSV Koordinat</h2>
                <form onSubmit={submitImport} className="space-y-4">
                    <div className="flex gap-4 items-center">
                        <input type="file" accept=".csv,.txt" onChange={handleFileChange} className="border p-2 rounded" />
                        <button type="submit" disabled={!importFile} className="bg-corporate-light text-white px-4 py-2 rounded hover:bg-corporate-dark disabled:opacity-50">
                            Konfirmasi Impor
                        </button>
                    </div>
                    {previewData && (
                        <div className="bg-gray-50 p-4 rounded text-sm border">
                            <p className="font-bold text-gray-700 mb-2">Preview (Menampilkan hingga 5 baris pertama dari total {previewData.total} baris):</p>
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b"><th className="pb-1">Code</th><th className="pb-1">Latitude</th><th className="pb-1">Longitude</th></tr>
                                </thead>
                                <tbody>
                                    {previewData.rows.map((r, i) => (
                                        <tr key={i} className="border-b last:border-0"><td className="py-1">{r.code}</td><td>{r.lat}</td><td>{r.lng}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </form>
                <p className="text-sm text-gray-500 mt-2">Format: code;latitude;longitude</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow border border-gray-100 overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2">Kode</th>
                            <th className="p-2">Nama</th>
                            <th className="p-2">Headcount</th>
                            <th className="p-2">Lat, Lng</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {locations.map(loc => (
                            <tr key={loc.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">{loc.code}</td>
                                <td className="p-2">{loc.name}</td>
                                <td className="p-2">{loc.employees_count}</td>
                                <td className="p-2">{loc.latitude ? `${loc.latitude}, ${loc.longitude}` : '-'}</td>
                                <td className="p-2">
                                    {loc.latitude ? 
                                        <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs">Ada</span> : 
                                        <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs">Belum</span>}
                                </td>
                                <td className="p-2">
                                    <button onClick={() => openEdit(loc)} className="text-blue-600 hover:underline">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedLoc && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Edit Koordinat: {selectedLoc.name}</h2>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm">Latitude (-11 s.d 6)</label>
                                    <input type="number" step="any" value={data.latitude} onChange={e => setData('latitude', e.target.value)} className="border p-2 w-full rounded" />
                                    {errors.latitude && <p className="text-red-600 text-sm">{errors.latitude}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm">Longitude (95 s.d 141)</label>
                                    <input type="number" step="any" value={data.longitude} onChange={e => setData('longitude', e.target.value)} className="border p-2 w-full rounded" />
                                    {errors.longitude && <p className="text-red-600 text-sm">{errors.longitude}</p>}
                                </div>
                            </div>
                            
                            <MiniMap 
                                lat={data.latitude} 
                                lng={data.longitude} 
                                onChange={(lat, lng) => setData({ latitude: lat.toFixed(6), longitude: lng.toFixed(6) })} 
                            />

                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setSelectedLoc(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Batal</button>
                                <button type="submit" disabled={processing} className="px-4 py-2 bg-corporate-light text-white rounded hover:bg-corporate-dark">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
