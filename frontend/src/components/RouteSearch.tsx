import React, { useState, useEffect } from 'react';
import { Navigation, ArrowDownUp, Zap, Sparkles, Loader2, Footprints, Clock } from 'lucide-react';
import { City, PopularRoute } from '../types';
import { searchLocations } from '../services/api';

interface LocationPoint {
  name: string;
  lat: number;
  lng: number;
}

interface RouteSearchProps {
  currentCity: City | null;
  onSearch: (params: {
    pickup: LocationPoint;
    destination: LocationPoint;
    optimization_mode: string;
    pickup_radius_meters: number;
    traffic_scenario?: string;
  }) => void;
  isLoading: boolean;
}

export const RouteSearch: React.FC<RouteSearchProps> = ({
  currentCity,
  onSearch,
  isLoading,
}) => {
  const [pickupText, setPickupText] = useState('');
  const [destText, setDestText] = useState('');
  const [pickupCoords, setPickupCoords] = useState<LocationPoint | null>(null);
  const [destCoords, setDestCoords] = useState<LocationPoint | null>(null);

  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [isSearchingPickup, setIsSearchingPickup] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);

  const [optimizationMode, setOptimizationMode] = useState<'both' | 'pickup' | 'drop'>('both');
  const [walkRadius, setWalkRadius] = useState<number>(500);
  const [trafficScenario, setTrafficScenario] = useState<'live' | 'peak_morning' | 'peak_evening'>('live');

  // Set default popular route when city changes
  useEffect(() => {
    if (currentCity && currentCity.popular_routes.length > 0) {
      const defaultRoute = currentCity.popular_routes[0];
      setPickupText(defaultRoute.pickup.name);
      setPickupCoords(defaultRoute.pickup);
      setDestText(defaultRoute.destination.name);
      setDestCoords(defaultRoute.destination);
    }
  }, [currentCity]);

  // Handle autocomplete debouncing for pickup
  useEffect(() => {
    if (!pickupText || (pickupCoords && pickupCoords.name === pickupText)) {
      setPickupSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingPickup(true);
      try {
        const results = await searchLocations(pickupText, currentCity?.name || '');
        setPickupSuggestions(results);
      } finally {
        setIsSearchingPickup(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [pickupText, currentCity]);

  // Handle autocomplete debouncing for destination
  useEffect(() => {
    if (!destText || (destCoords && destCoords.name === destText)) {
      setDestSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingDest(true);
      try {
        const results = await searchLocations(destText, currentCity?.name || '');
        setDestSuggestions(results);
      } finally {
        setIsSearchingDest(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [destText, currentCity]);

  const handleSwap = () => {
    const tempText = pickupText;
    const tempCoords = pickupCoords;
    setPickupText(destText);
    setPickupCoords(destCoords);
    setDestText(tempText);
    setDestCoords(tempCoords);
  };

  const handlePopularSelect = (route: PopularRoute) => {
    setPickupText(route.pickup.name);
    setPickupCoords(route.pickup);
    setDestText(route.destination.name);
    setDestCoords(route.destination);
    onSearch({
      pickup: route.pickup,
      destination: route.destination,
      optimization_mode: optimizationMode,
      pickup_radius_meters: walkRadius,
      traffic_scenario: trafficScenario,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupCoords || !destCoords) return;
    onSearch({
      pickup: pickupCoords,
      destination: destCoords,
      optimization_mode: optimizationMode,
      pickup_radius_meters: walkRadius,
      traffic_scenario: trafficScenario,
    });
  };

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>Plan Rebel Route</span>
        </h2>
        <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
          Anti-Gridlock AI
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Pickup Input */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 focus-within:border-emerald-500 transition-colors">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <input
              type="text"
              value={pickupText}
              onChange={(e) => setPickupText(e.target.value)}
              placeholder="Origin / Tech Park / Landmark"
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            {isSearchingPickup && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
          </div>
          {pickupSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-dark-900 border border-dark-700 rounded-xl shadow-2xl z-40 max-h-48 overflow-y-auto">
              {pickupSuggestions.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPickupText(item.name);
                    setPickupCoords({ name: item.name, lat: item.lat, lng: item.lng });
                    setPickupSuggestions([]);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-dark-800 border-b border-dark-800 last:border-0"
                >
                  <p className="font-semibold text-slate-100">{item.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{item.display_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Swap button */}
        <div className="flex justify-center -my-1">
          <button
            type="button"
            onClick={handleSwap}
            className="p-1 rounded-full bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white transition-colors border border-dark-700"
            title="Swap Origin and Destination"
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Destination Input */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 focus-within:border-cyan-500 transition-colors">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
            <input
              type="text"
              value={destText}
              onChange={(e) => setDestText(e.target.value)}
              placeholder="Destination / Office / Address"
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            {isSearchingDest && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
          </div>
          {destSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-dark-900 border border-dark-700 rounded-xl shadow-2xl z-40 max-h-48 overflow-y-auto">
              {destSuggestions.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setDestText(item.name);
                    setDestCoords({ name: item.name, lat: item.lat, lng: item.lng });
                    setDestSuggestions([]);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-dark-800 border-b border-dark-800 last:border-0"
                >
                  <p className="font-semibold text-slate-100">{item.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{item.display_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Rebel Controls: Optimization Mode & Walk Radius */}
        <div className="pt-2 border-t border-dark-800 grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1.5">
              Shift Boundary Mode:
            </label>
            <div className="grid grid-cols-3 gap-1 bg-dark-950 p-1 rounded-lg border border-dark-800">
              {(['both', 'pickup', 'drop'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setOptimizationMode(mode)}
                  className={`py-1 capitalize rounded text-[11px] font-medium transition-all ${
                    optimizationMode === mode
                      ? 'bg-emerald-500 text-dark-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Footprints className="w-3 h-3 text-emerald-400" />
                <span>Max Walk:</span>
              </label>
              <span className="text-emerald-400 font-bold text-[11px]">{walkRadius}m</span>
            </div>
            <input
              type="range"
              min={200}
              max={1200}
              step={100}
              value={walkRadius}
              onChange={(e) => setWalkRadius(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-dark-800 rounded-lg"
            />
          </div>
        </div>

        {/* Departure Time & Traffic Scenario */}
        <div className="pt-2 border-t border-dark-800">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Traffic Time:</span>
            </label>
            <span className="text-[10px] text-slate-400 font-medium">Real-time dynamic</span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-dark-950 p-1 rounded-lg border border-dark-800">
            {[
              { id: 'live', label: '🕒 Right Now' },
              { id: 'peak_morning', label: '🌅 9:15 AM Rush' },
              { id: 'peak_evening', label: '🌆 6:45 PM Peak' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTrafficScenario(id as any)}
                className={`py-1 rounded text-[11px] font-medium transition-all ${
                  trafficScenario === id
                    ? 'bg-cyan-500 text-dark-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !pickupCoords || !destCoords}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-dark-950 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all mt-3"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing Choke Points...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Argue with Google Maps</span>
            </>
          )}
        </button>
      </form>

      {/* Popular City Routes */}
      {currentCity && currentCity.popular_routes.length > 0 && (
        <div className="mt-4 pt-3 border-t border-dark-800">
          <p className="text-[11px] text-slate-400 font-medium mb-2 uppercase tracking-wider">
            Popular Commuter Gridlocks ({currentCity.name}):
          </p>
          <div className="space-y-1.5">
            {currentCity.popular_routes.map((pRoute, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handlePopularSelect(pRoute)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg bg-dark-950 hover:bg-dark-800 border border-dark-800 text-[11px] text-slate-300 hover:text-emerald-300 flex items-center justify-between group transition-colors"
              >
                <span className="truncate">{pRoute.title}</span>
                <Navigation className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
