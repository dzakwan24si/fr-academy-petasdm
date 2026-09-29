import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import { MapPin } from 'lucide-react';
import { companies } from '../data/mockData';
import 'leaflet/dist/leaflet.css';

// Custom MapPin icon menggunakan Lucide React dengan warna corporate (Dark Teal)
const CorporateIcon = L.divIcon({
  html: renderToString(<MapPin color="#004D40" size={36} strokeWidth={2.5} />),
  className: 'custom-leaflet-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

// Komponen helper untuk mengontrol kamera Peta (Animasi FlyTo)
function MapController({ selectedCompany, defaultCenter, defaultZoom }) {
  const map = useMap();
  useEffect(() => {
    if (selectedCompany) {
      // Zoom ke titik perusahaan
      map.flyTo(selectedCompany.coordinates, 12, { duration: 1.5 });
    } else {
      // Kembali ke tampilan seluruh Indonesia
      map.flyTo(defaultCenter, defaultZoom, { duration: 1.5 });
    }
  }, [selectedCompany, map, defaultCenter, defaultZoom]);
  return null;
}

export default function MapViewer({ onMarkerClick, selectedCompany }) {
  const indonesiaCenter = [-0.5, 110.0]; // Posisi tengah mencakup Sumatera & Kalimantan
  const zoomLevel = 5;

  return (
    <div className="w-full h-full relative z-0 bg-[#f3f4f5]">
      <MapContainer
        center={indonesiaCenter}
        zoom={zoomLevel}
        className="w-full h-full"
        zoomControl={false}
      >
        <MapController 
          selectedCompany={selectedCompany} 
          defaultCenter={indonesiaCenter} 
          defaultZoom={zoomLevel} 
        />
        
        {/* Google Maps Base Tile Layer */}
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        />

        {/* Marker untuk setiap perusahaan */}
        {companies.map((company) => (
          <Marker
            key={company.id}
            position={company.coordinates}
            icon={CorporateIcon}
            eventHandlers={{
              click: () => onMarkerClick(company),
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -28]}
              opacity={1}
              className="bg-white/90 backdrop-blur-sm border-none shadow-lg text-gray-800 font-bold px-3 py-1.5 rounded-lg text-sm"
            >
              {company.name}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
