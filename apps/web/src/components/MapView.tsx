'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

type Station = { id: string; name: string; lat: number; lng: number };
type Resource = {
  id: string;
  callSign: string;
  stationId: string;
  status: string;
  lat?: number;
  lng?: number;
  station?: { lat: number; lng: number };
};
type Incident = { id: string; type: string; status: string; lat: number; lng: number; label?: string };

const MORRINSVILLE_CENTRE = { lng: 175.53, lat: -37.65 };

export default function MapView({
  stations,
  resources,
  incidents,
  selectedId,
  onSelect,
}: {
  stations: Station[];
  resources: Resource[];
  incidents: Incident[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ station: maplibregl.Marker[]; resource: maplibregl.Marker[]; incident: maplibregl.Marker[] }>({
    station: [],
    resource: [],
    incident: [],
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [MORRINSVILLE_CENTRE.lng, MORRINSVILLE_CENTRE.lat],
      zoom: 9,
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    markersRef.current.station.forEach((m) => m.remove());
    markersRef.current.station = [];
    markersRef.current.resource.forEach((m) => m.remove());
    markersRef.current.resource = [];
    markersRef.current.incident.forEach((m) => m.remove());
    markersRef.current.incident = [];

    const map = mapRef.current;
    if (!map) return;

    stations.forEach((s) => {
      const el = document.createElement('div');
      el.className = 'w-3 h-3 rounded-full bg-blue-500 border border-white';
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([s.lng, s.lat])
        .addTo(map);
      marker.getElement().addEventListener('click', () => onSelect(s.id));
      markersRef.current.station.push(marker);
    });

    resources.forEach((r) => {
      const coords = r.lat != null && r.lng != null ? [r.lng, r.lat] : r.station ? [r.station.lng, r.station.lat] : null;
      if (!coords) return;
      const el = document.createElement('div');
      el.className = `w-2.5 h-2.5 rounded-full border border-white ${r.status === 'ON_SCENE' ? 'bg-green-500' : r.status === 'ENROUTE' ? 'bg-yellow-500' : 'bg-slate-400'}`;
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(coords as [number, number])
        .addTo(map);
      marker.getElement().addEventListener('click', () => onSelect(r.id));
      markersRef.current.resource.push(marker);
    });

    incidents.forEach((i) => {
      const el = document.createElement('div');
      el.className = `w-4 h-4 rounded bg-amber-500 border-2 border-white cursor-pointer ${selectedId === i.id ? 'ring-2 ring-white' : ''}`;
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([i.lng, i.lat])
        .addTo(map);
      marker.getElement().addEventListener('click', () => onSelect(i.id));
      markersRef.current.incident.push(marker);
    });
  }, [stations, resources, incidents, selectedId, onSelect]);

  return <div ref={containerRef} className="h-full w-full" />;
}
