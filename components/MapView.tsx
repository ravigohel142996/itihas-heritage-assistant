import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewProps {
  placeName: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  nearbyPlaces?: Array<{ name: string; lat: number; lng: number; distance?: string }>;
}

/**
 * MapView component displays an interactive map with the heritage site location
 * Uses Leaflet with OpenStreetMap tiles for free, open-source mapping
 */
const MapView: React.FC<MapViewProps> = ({ placeName, location, coordinates, nearbyPlaces = [] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Default coordinates (India center) if not provided
    const defaultCoords = coordinates || { lat: 20.5937, lng: 78.9629 };

    // Initialize map only once
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: [defaultCoords.lat, defaultCoords.lng],
        zoom: coordinates ? 13 : 5,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    // Clear existing markers
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstanceRef.current?.removeLayer(layer);
      }
    });

    // Add main location marker with custom icon
    const mainIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background: #d4af37; border: 3px solid #1a1a1a; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.5);"><span style="color: #1a1a1a; font-weight: bold; font-size: 16px;">📍</span></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });

    const mainMarker = L.marker([defaultCoords.lat, defaultCoords.lng], { icon: mainIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(`<div style="font-family: 'Cinzel', serif; color: #1a1a1a;"><strong>${placeName}</strong><br/><small>${location}</small></div>`);

    // Add nearby places markers if available
    if (nearbyPlaces.length > 0) {
      const nearbyIcon = L.divIcon({
        className: 'nearby-marker',
        html: `<div style="background: #8a2be2; border: 2px solid #1a1a1a; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><span style="color: white; font-size: 10px;">🏛️</span></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 20],
      });

      nearbyPlaces.forEach((place) => {
        L.marker([place.lat, place.lng], { icon: nearbyIcon })
          .addTo(mapInstanceRef.current!)
          .bindPopup(`<div style="font-family: 'Cinzel', serif; color: #1a1a1a;"><strong>${place.name}</strong>${place.distance ? `<br/><small>${place.distance} away</small>` : ''}</div>`);
      });

      // Fit bounds to show all markers
      const bounds = L.latLngBounds([
        [defaultCoords.lat, defaultCoords.lng],
        ...nearbyPlaces.map(p => [p.lat, p.lng] as [number, number])
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // Center on main location
      mapInstanceRef.current.setView([defaultCoords.lat, defaultCoords.lng], coordinates ? 13 : 5);
    }

    // Cleanup
    return () => {
      // Don't destroy the map, just clean up markers
    };
  }, [placeName, location, coordinates, nearbyPlaces]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-stone-800 shadow-2xl">
      <div ref={mapRef} className="w-full h-full min-h-[400px]" />
      {!coordinates && (
        <div className="absolute top-4 left-4 right-4 bg-black/70 backdrop-blur-md border border-heritage-gold/50 px-4 py-2 rounded text-xs text-heritage-gold flex items-center gap-2 z-[1000]">
          <span>📍</span>
          <span>Showing approximate location - exact coordinates not available</span>
        </div>
      )}
    </div>
  );
};

export default MapView;
