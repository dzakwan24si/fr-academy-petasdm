import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { LeafletIcon } from '../LeafletIcon';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';

function MapEffect({ locations, selectedCompanyId, selectedLocationId }) {
    const map = useMap();
    
    useEffect(() => {
        if (!locations || locations.length === 0) return;
        
        let bounds = [];
        
        if (selectedCompanyId) {
            const locs = locations.filter(l => l.companies && l.companies.includes(selectedCompanyId) && l.latitude);
            if (locs.length > 0) {
                locs.forEach(l => bounds.push([l.latitude, l.longitude]));
            }
        } else if (selectedLocationId) {
            const loc = locations.find(l => l.id === selectedLocationId);
            if (loc && loc.latitude) {
                map.flyTo([loc.latitude, loc.longitude], 12, { animate: true, duration: 1.5 });
                return;
            }
        } else {
            // All locations
            locations.filter(l => l.latitude).forEach(l => bounds.push([l.latitude, l.longitude]));
        }

        if (bounds.length > 0) {
            map.flyToBounds(bounds, { animate: true, duration: 1.5, padding: [50, 50] });
        }
    }, [selectedCompanyId, selectedLocationId, locations, map]);

    return null;
}

export function SdmMap({ locations, selectedCompanyId, selectedLocationId, onSelectLocation }) {
    const validLocs = locations.filter(l => l.latitude && l.longitude);

    // region colors
    const regionColors = {
        'Sumatera': '#ef4444', // red
        'Kalimantan': '#3b82f6', // blue
        'Riau': '#eab308', // yellow
        'Kalbar': '#22c55e', // green
        'Kaltim': '#a855f7', // purple
        'Kubar': '#ec4899', // pink
        'Corp': '#111827', // dark for Corp
        'Non': '#64748b',
        'Unknown': '#9ca3af' // gray
    };

    const createCustomIcon = (region, hc, isCorp, source) => {
        const bgStyle = isCorp 
            ? 'background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%);' 
            : `background-color: ${regionColors[region] || regionColors['Unknown']};`;
            
        const shape = isCorp ? 'border-radius: 8px;' : 'border-radius: 50%;';
        const label = isCorp ? '🏢' : (hc === '<5' ? hc : hc);
        const borderStyle = source === 'pendekatan' ? '2px dashed rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.9)';
        const shadow = isCorp ? 'box-shadow: 0 4px 10px rgba(23, 37, 84, 0.5);' : 'box-shadow: 0 2px 6px rgba(0,0,0,0.3);';

        return L.divIcon({
            html: `<div style="${bgStyle} width: 32px; height: 32px; ${shape} border: ${borderStyle}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; ${shadow} transition: all 0.3s ease;">${label}</div>`,
            className: 'custom-leaflet-icon',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
    };

    return (
        <MapContainer 
            center={[-2.5, 118.0]} 
            zoom={5} 
            className="h-full w-full z-0" 
            zoomControl={false}
            preferCanvas={true}
            zoomSnap={1}
            wheelPxPerZoomLevel={60}
        >
            <TileLayer
                url={import.meta.env.VITE_MAP_TILE_URL || "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"}
                attribution={import.meta.env.VITE_MAP_ATTRIBUTION || '&copy; Google Maps'}
            />
            <MarkerClusterGroup 
                chunkedLoading={true} 
                maxClusterRadius={40}
                spiderfyOnMaxZoom={true}
                removeOutsideVisibleBounds={true}
            >
                {validLocs.map(loc => (
                    <Marker 
                        key={loc.id} 
                        position={[loc.latitude, loc.longitude]}
                        icon={createCustomIcon(loc.region || 'Unknown', loc.employee_count, loc.name.includes('Corporate Office'), loc.coordinate_source)}
                        eventHandlers={{
                            click: () => {
                                const companies = loc.companies || [];
                                onSelectLocation(loc.id, companies.length === 1 ? companies[0] : null);
                            }
                        }}
                    >
                        <Tooltip>
                            <div className="text-sm">
                                <p className="font-bold">{loc.name}</p>
                                <p>HC: {loc.employee_count}</p>
                                <p>Perusahaan: {(loc.companies || []).length}</p>
                                {loc.coordinate_source === 'pendekatan' && (
                                    <p className="text-xs text-orange-500 font-bold">Lokasi perkiraan</p>
                                )}
                            </div>
                        </Tooltip>
                    </Marker>
                ))}
            </MarkerClusterGroup>
            
            <MapEffect 
                locations={locations} 
                selectedCompanyId={selectedCompanyId} 
                selectedLocationId={selectedLocationId} 
            />
        </MapContainer>
    );
}
