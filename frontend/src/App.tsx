import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CitySelector } from './components/CitySelector';
import { RouteSearch } from './components/RouteSearch';
import { RouteComparisonCard } from './components/RouteComparisonCard';
import { ChokePointWalkCard } from './components/ChokePointWalkCard';
import { ForecastChart } from './components/ForecastChart';
import { ErrandPlanner } from './components/ErrandPlanner';
import { MapView } from './components/MapView';
import { City, OptimalRouteResponse, MultiStopTodoResponse } from './types';
import { fetchCities, calculateOptimalRoute } from './services/api';
import { Flame, Clock, Coffee, Route, Map, Navigation } from 'lucide-react';

export const App: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [routeData, setRouteData] = useState<OptimalRouteResponse | null>(null);
  const [errandData, setErrandData] = useState<MultiStopTodoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'route' | 'chokes' | 'forecast' | 'errands'>('route');
  const [mobileTab, setMobileTab] = useState<'map' | 'route'>('map');

  // Load cities on mount
  useEffect(() => {
    fetchCities()
      .then((data) => {
        setCities(data);
        if (data.length > 0) {
          setCurrentCity(data[0]); // Default to Bengaluru
        }
      })
      .catch((err) => {
        console.error('Failed to load cities:', err);
      });
  }, []);

  const [isRefreshingLive, setIsRefreshingLive] = useState(false);

  const handleRefreshTraffic = async () => {
    setIsRefreshingLive(true);
    try {
      const data = await fetchCities();
      setCities(data);
      if (currentCity) {
        const updated = data.find((c) => c.id === currentCity.id);
        if (updated) setCurrentCity(updated);
      }
    } catch (err) {
      console.error('Failed to refresh traffic:', err);
    } finally {
      setIsRefreshingLive(false);
    }
  };

  const handleSelectCity = (city: City) => {
    setCurrentCity(city);
    setRouteData(null);
    setErrandData(null);
    setErrorMsg(null);
    setMobileTab('map');
  };

  const handleSearch = async (params: {
    pickup: { name: string; lat: number; lng: number };
    destination: { name: string; lat: number; lng: number };
    optimization_mode: string;
    pickup_radius_meters: number;
    traffic_scenario?: string;
  }) => {
    if (!currentCity) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await calculateOptimalRoute({
        city_id: currentCity.id,
        pickup: params.pickup,
        destination: params.destination,
        optimization_mode: params.optimization_mode,
        pickup_radius_meters: params.pickup_radius_meters,
        traffic_scenario: params.traffic_scenario,
      });
      setRouteData(data);
      setErrandData(null);
      // On mobile, immediately show the calculated route on the map
      setMobileTab('map');
    } catch (err: any) {
      setErrorMsg(err.message || 'Route calculation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation */}
      <Header currentCity={currentCity} />

      {/* City Switcher Ribbon */}
      <CitySelector
        cities={cities}
        selectedCity={currentCity}
        onSelectCity={handleSelectCity}
      />

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Left Sidebar Control Panel */}
        <aside
          className={`w-full md:w-[460px] lg:w-[490px] h-full overflow-y-auto bg-dark-950/95 border-r border-dark-800 p-4 space-y-4 z-10 custom-scrollbar shrink-0 shadow-2xl flex-col ${
            mobileTab === 'route' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Mobile Back to Map Header Button */}
          {routeData && (
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setMobileTab('map')}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow active:scale-95"
              >
                <Map className="w-4 h-4" />
                <span>View Full Map & Live Route (Save ~{routeData.total_time_saved_minutes}m) ➔</span>
              </button>
            </div>
          )}

          {/* City Tagline */}
          {currentCity && (
            <div className="px-1">
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold block">
                {currentCity.name}, {currentCity.state}
              </span>
              <p className="text-xs text-slate-400 italic mt-0.5 font-mono">
                "{currentCity.tagline}"
              </p>
            </div>
          )}

          {/* Route Planning Search Box */}
          <RouteSearch
            currentCity={currentCity}
            onSearch={handleSearch}
            isLoading={isLoading}
          />

          {errorMsg && (
            <div className="bg-rose-950/40 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Sub Navigation Tabs for Output */}
          {routeData && (
            <div className="grid grid-cols-4 gap-1 bg-dark-900 p-1 rounded-xl border border-dark-800 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('route')}
                className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'route'
                    ? 'bg-emerald-500 text-dark-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Route className="w-4 h-4" />
                <span>Verdict</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('chokes')}
                className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'chokes'
                    ? 'bg-orange-500 text-dark-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>Chokes ({routeData.choke_bypasses.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('forecast')}
                className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'forecast'
                    ? 'bg-cyan-500 text-dark-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Radar</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('errands')}
                className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'errands'
                    ? 'bg-purple-500 text-dark-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Coffee className="w-4 h-4" />
                <span>Errands</span>
              </button>
            </div>
          )}

          {/* Tab Content Display */}
          {routeData && (
            <div className="space-y-4">
              {activeTab === 'route' && (
                <>
                  <RouteComparisonCard routeData={routeData} />
                  {routeData.choke_bypasses.length > 0 && (
                    <ChokePointWalkCard bypasses={routeData.choke_bypasses} />
                  )}
                </>
              )}

              {activeTab === 'chokes' && (
                <ChokePointWalkCard bypasses={routeData.choke_bypasses} />
              )}

              {activeTab === 'forecast' && (
                <ForecastChart baselineMinutes={routeData.direct_duration_minutes} />
              )}

              {activeTab === 'errands' && (
                <ErrandPlanner
                  cityId={currentCity?.id || 'bengaluru'}
                  pickup={
                    routeData.direct_route.coordinates[0]
                      ? {
                          name: 'Pickup',
                          lat: routeData.direct_route.coordinates[0][0],
                          lng: routeData.direct_route.coordinates[0][1],
                        }
                      : null
                  }
                  destination={
                    routeData.direct_route.coordinates.length > 0
                      ? {
                          name: 'Destination',
                          lat:
                            routeData.direct_route.coordinates[
                              routeData.direct_route.coordinates.length - 1
                            ][0],
                          lng:
                            routeData.direct_route.coordinates[
                              routeData.direct_route.coordinates.length - 1
                            ][1],
                        }
                      : null
                  }
                  onErrandsCalculated={(errands) => setErrandData(errands)}
                />
              )}
            </div>
          )}

          {/* Creator Patch */}
          <div className="pt-4 pb-2 text-center border-t border-dark-800/60 mt-auto">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <span>Created with</span>
              <span className="text-rose-500">❤️</span>
              <span>by</span>
              <span className="font-semibold text-slate-200">Shubhransh Gupta</span>
            </p>
          </div>
        </aside>

        {/* Right Interactive Map Canvas */}
        <main
          className={`flex-1 h-full relative ${
            mobileTab === 'map' ? 'block' : 'hidden md:block'
          }`}
        >
          <MapView
            currentCity={currentCity}
            routeData={routeData}
            errandData={errandData}
            onRefreshLiveTraffic={handleRefreshTraffic}
            isRefreshingLive={isRefreshingLive}
          />

          {/* Mobile Floating Verdict Drawer on Map */}
          {routeData && (
            <div className="md:hidden absolute bottom-3 left-3 right-3 z-[1000] bg-dark-900/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-3 shadow-2xl">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs truncate">
                    <span>⚡ Save ~{routeData.total_time_saved_minutes} mins</span>
                    <span className="text-slate-400 font-normal">
                      ({routeData.rebel_duration_minutes}m vs {routeData.direct_duration_minutes}m)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 truncate">
                    {routeData.simple_action_steps?.[0] || 'Cheat code route ready'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileTab('route')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-bold text-xs shrink-0 shadow-lg active:scale-95 flex items-center gap-1"
                >
                  <span>Steps</span>
                  <span>➔</span>
                </button>
              </div>
            </div>
          )}

          {/* Mobile Floating "Plan Route" Button on Map when no route is planned */}
          {!routeData && (
            <div className="md:hidden absolute bottom-3 left-4 right-4 z-[1000]">
              <button
                type="button"
                onClick={() => setMobileTab('route')}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-extrabold text-sm shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95"
              >
                <Navigation className="w-4 h-4" />
                <span>Plan Commute & Find Cheat Codes</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden h-14 bg-dark-900/95 backdrop-blur-md border-t border-dark-800 flex items-center justify-around px-2 z-30 shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('map')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-xs transition-colors ${
            mobileTab === 'map' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[10px]">Live Map</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('route')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-xs transition-colors relative ${
            mobileTab === 'route' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Navigation className="w-5 h-5" />
          <span className="text-[10px]">
            {routeData ? 'Route Steps' : 'Plan Commute'}
          </span>
          {routeData && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setMobileTab('route');
            setActiveTab('chokes');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-xs transition-colors ${
            mobileTab === 'route' && activeTab === 'chokes' ? 'text-orange-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Flame className="w-5 h-5" />
          <span className="text-[10px]">Chokes ({currentCity?.choke_points.length || 0})</span>
        </button>
      </nav>
    </div>
  );
};
