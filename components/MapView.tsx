
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Lead } from '../types';

interface MapViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

const MapView: React.FC<MapViewProps> = ({ leads, onSelectLead }) => {
  
  // Filter leads that have coordinates
  const geoLeads = useMemo(() => leads.filter(l => l.coordinates && l.coordinates.lat && l.coordinates.lng), [leads]);

  // Center map on the first lead or default to Palermo, Buenos Aires
  const centerPosition: [number, number] = geoLeads.length > 0 
    ? [geoLeads[0].coordinates!.lat, geoLeads[0].coordinates!.lng] 
    : [-34.588, -58.43]; 

  const getMarkerColor = (status: string) => {
      switch(status) {
          case 'client': return '#10b981'; // Emerald
          case 'negotiation': return '#f59e0b'; // Amber
          case 'contacted': return '#3b82f6'; // Blue
          default: return '#9ca3af'; // Gray
      }
  }

  // Modern SVG Pin
  const createIcon = (color: string) => {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5">
          <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
        </svg>
      `;
      const encoded = encodeURIComponent(svg);

      return L.divIcon({
          className: "custom-pin",
          html: `<div style="width: 32px; height: 32px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); transform: translate(-50%, -100%);">
                   <img src="data:image/svg+xml;charset=utf-8,${encoded}" style="width: 100%; height: 100%;" />
                 </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -34]
      });
  }

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in">
        
        {/* Map Header / Legend */}
        <div className="glass-solid p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                    <span className="text-2xl">🗺️</span> Mapa de Oportunidades
                </h2>
                <p className="text-[10px] text-white/50 uppercase tracking-widest mt-1">
                    Visualizando {geoLeads.length} de {leads.length} registros con Geo-Data
                </p>
            </div>
            
            <div className="flex gap-4 bg-black/40 p-2 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                    <span className="text-[9px] font-bold text-white uppercase">Clientes</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span>
                    <span className="text-[9px] font-bold text-white uppercase">En Negociación</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span>
                    <span className="text-[9px] font-bold text-white uppercase">Contactados</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                    <span className="text-[9px] font-bold text-white uppercase">Fríos</span>
                </div>
            </div>
        </div>

        {/* The Map */}
        <div className="flex-1 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative z-0 h-[600px]">
            <MapContainer 
                center={centerPosition} 
                zoom={13} 
                style={{ height: '100%', width: '100%', background: '#050505' }}
            >
                {/* CartoDB Dark Matter Tiles - Profesional & Dark Native */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                
                {geoLeads.map(lead => (
                    <Marker 
                        key={lead.id} 
                        position={[lead.coordinates!.lat, lead.coordinates!.lng]}
                        icon={createIcon(getMarkerColor(lead.status))}
                    >
                        <Popup>
                            <div className="p-1 min-w-[180px] font-sans">
                                <div className="flex items-center justify-between mb-2">
                                     <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded text-white ${
                                         lead.status === 'client' ? 'bg-emerald-500' : 
                                         lead.status === 'negotiation' ? 'bg-amber-500' :
                                         lead.status === 'contacted' ? 'bg-blue-500' : 'bg-gray-500'
                                     }`}>{lead.status}</span>
                                     <span className="text-[9px] font-bold text-white/50 uppercase">{lead.owner}</span>
                                </div>
                                <h3 className="font-black text-white uppercase text-sm mb-1 leading-tight">{lead.name}</h3>
                                <p className="text-[10px] text-white/70 mb-3 truncate">{lead.location}</p>
                                
                                <button 
                                    onClick={() => onSelectLead(lead)}
                                    className="w-full bg-white text-black text-[10px] font-black uppercase py-2 rounded-lg hover:bg-indigo-50 transition-colors shadow-lg"
                                >
                                    Ver Detalles
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
            
            {/* Warning if few coordinates */}
            {geoLeads.length < leads.length && (
                <div className="absolute bottom-4 left-4 z-[400] bg-black/80 backdrop-blur border border-white/10 p-3 rounded-xl max-w-xs shadow-xl">
                    <p className="text-[10px] text-orange-300 font-bold mb-1">⚠️ Datos Parciales</p>
                    <p className="text-[9px] text-white/60">
                        {leads.length - geoLeads.length} leads no tienen coordenadas GPS y no aparecen aquí. 
                        La IA intentará obtenerlas en las próximas búsquedas.
                    </p>
                </div>
            )}
        </div>
    </div>
  );
};

export default MapView;
