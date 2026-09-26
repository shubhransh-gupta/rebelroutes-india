import React, { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  Circle,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import { City, OptimalRouteResponse, MultiStopTodoResponse } from '../types';

interface MapViewProps {
  currentCity: City | null;
  routeData: OptimalRouteResponse | null;
  errandData: MultiStopTodoResponse | null;
}

// Custom Leaflet Icons
const createCustomIcon = (color: string, label: string, size: number = 28) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #06080d;
        font-weight: 800;
        font-size: 11px;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 14px rgba(0,0,0,0.5);
      ">
        ${label}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const pickupIcon = createCustomIcon('#10b981', 'A');
const destIcon = createCustomIcon('#f43f5e', 'B');
const shiftedPickupIcon = createCustomIcon('#06b6d4', '🚶', 32);
const exitChokeIcon = createCustomIcon('#f97316', '1', 24);
const rebookChokeIcon = createCustomIcon('#10b981', 'R', 24);
const errandIcon = createCustomIcon('#a855f7', '★', 24);

// Component to dynamically fit map bounds when route changes
const MapRecenter: React.FC<{
  center: [number, number];
  zoom: number;
  routeCoordinates?: [number, number][];
}> = ({ center, zoom, routeCoordinates }) => {
  const map = useMap();

  useEffect(() => {
    if (routeCoordinates && routeCoordinates.length > 0) {
      const bounds = L.latLngBounds(routeCoordinates);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      map.setView(center, zoom);
    }
  }, [map, center, zoom, routeCoordinates]);

  return null;
};

export const MapView: React.FC<MapViewProps> = ({
  currentCity,
  routeData,
  errandData,
}) => {
  const center: [number, number] = useMemo(() => {
    if (currentCity) return [currentCity.center.lat, currentCity.center.lng];
    return [12.9716, 77.5946];
  }, [currentCity]);

  const zoom = currentCity?.zoom || 12;

  const directPolyline = useMemo(() => {
    return routeData?.direct_route?.coordinates || [];
  }, [routeData]);

  const rebelPolyline = useMemo(() => {
    return routeData?.rebel_route?.coordinates || [];
  }, [routeData]);

  const pickupPoint = useMemo(() => {
    if (!directPolyline.length) return null;
    return directPolyline[0];
  }, [directPolyline]);

  const destPoint = useMemo(() => {
    if (!directPolyline.length) return null;
    return directPolyline[directPolyline.length - 1];
  }, [directPolyline]);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <MapRecenter
          center={center}
          zoom={zoom}
          routeCoordinates={rebelPolyline.length ? rebelPolyline : undefined}
        />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Choke Point Hotspot Radars for Active City */}
        {currentCity?.choke_points.map((choke, i) => (
          <React.Fragment key={i}>
            <Circle
              center={[choke.coords.lat, choke.coords.lng]}
              radius={400}
              pathOptions={{
                color: '#f97316',
                fillColor: '#f97316',
                fillOpacity: 0.15,
                weight: 1.5,
                dashArray: '4, 6',
              }}
            />
            <Marker
              position={[choke.coords.lat, choke.coords.lng]}
              icon={createCustomIcon('#f97316', '⚡', 22)}
            >
              <Popup className="custom-popup">
                <div className="p-1">
                  <p className="font-bold text-slate-900 text-xs">{choke.name}</p>
                  <p className="text-[11px] text-slate-700 mt-1">{choke.bypass_tip}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">
                    Avg Crawl: {choke.avg_crawl_speed_kmh} km/h
                  </span>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {/* Direct Standard Route (Dashed Slate) */}
        {directPolyline.length > 0 && (
          <Polyline
            positions={directPolyline}
            pathOptions={{
              color: '#64748b',
              weight: 4,
              opacity: 0.6,
              dashArray: '8, 8',
            }}
          />
        )}

        {/* Rebel Optimal Route (Glowing Emerald) */}
        {rebelPolyline.length > 0 && (
          <Polyline
            positions={rebelPolyline}
            pathOptions={{
              color: '#10b981',
              weight: 6,
              opacity: 0.95,
            }}
          />
        )}

        {/* Choke Point Walking Shortcuts (Orange Dotted) */}
        {routeData?.choke_bypasses.map((bp, i) => (
          <React.Fragment key={i}>
            <Polyline
              positions={bp.walking_path}
              pathOptions={{
                color: '#f97316',
                weight: 5,
                opacity: 0.95,
                dashArray: '3, 7',
              }}
            />
            <Marker
              position={[bp.exit_point.lat, bp.exit_point.lng]}
              icon={exitChokeIcon}
            >
              <Popup>
                <div className="p-1 text-slate-900 text-xs">
                  <strong>Exit Cab Here</strong>: Walk past {bp.choke_name}
                </div>
              </Popup>
            </Marker>
            <Marker
              position={[bp.rebook_point.lat, bp.rebook_point.lng]}
              icon={rebookChokeIcon}
            >
              <Popup>
                <div className="p-1 text-slate-900 text-xs">
                  <strong>Rebook Cab Here</strong>: Open arterial road
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {/* Origin Marker */}
        {pickupPoint && (
          <Marker position={pickupPoint} icon={pickupIcon}>
            <Popup>
              <div className="p-1 text-slate-900 text-xs font-bold">Original Origin (Point A)</div>
            </Popup>
          </Marker>
        )}

        {/* Shifted Pickup Marker */}
        {routeData?.pickup_arbitrage && (
          <Marker
            position={[
              routeData.pickup_arbitrage.location.lat,
              routeData.pickup_arbitrage.location.lng,
            ]}
            icon={shiftedPickupIcon}
          >
            <Popup>
              <div className="p-1 text-slate-900 text-xs">
                <strong className="text-emerald-700">Recommended Shifted Pickup:</strong>
                <p className="mt-1">{routeData.pickup_arbitrage.reason}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destPoint && (
          <Marker position={destPoint} icon={destIcon}>
            <Popup>
              <div className="p-1 text-slate-900 text-xs font-bold">Destination (Point B)</div>
            </Popup>
          </Marker>
        )}

        {/* On-the-way Errand Stops */}
        {errandData?.stops.map((stop, i) => (
          <Marker
            key={i}
            position={[stop.location.lat, stop.location.lng]}
            icon={errandIcon}
          >
            <Popup>
              <div className="p-1 text-slate-900 text-xs">
                <strong>{stop.name}</strong>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Detour: +{Math.round(stop.detour_seconds / 60)} mins ({Math.round(stop.detour_meters)}m)
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 right-4 z-20 bg-dark-900/90 backdrop-blur-md border border-dark-700 rounded-xl p-3 text-[11px] space-y-1.5 shadow-2xl hidden sm:block">
        <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
          Map Legend
        </span>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-emerald-500 rounded-full" />
          <span className="text-slate-200">Rebel Optimal Route</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-slate-500 border-dashed border-b" />
          <span className="text-slate-400">Standard Google Route</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-orange-500 border-dotted border-b-2" />
          <span className="text-orange-300">Walk Past Choke Point</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500/30 border border-orange-500" />
          <span className="text-slate-400">Known Traffic Hotspot</span>
        </div>
      </div>
    </div>
  );
};
