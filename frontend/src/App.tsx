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
import { Flame, Clock, Coffee, Route } from 'lucide-react';

export const App: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [routeData, setRouteData] = useState<OptimalRouteResponse | null>(null);
  const [errandData, setErrandData] = useState<MultiStopTodoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'route' | 'chokes' | 'forecast' | 'errands'>('route');

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

  const handleSelectCity = (city: City) => {
    setCurrentCity(city);
    setRouteData(null);
    setErrandData(null);
    setErrorMsg(null);
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
        <aside className="w-full md:w-[460px] lg:w-[490px] h-[50vh] md:h-full overflow-y-auto bg-dark-950/95 border-r border-dark-800 p-4 space-y-4 z-10 custom-scrollbar shrink-0 shadow-2xl">
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
        </aside>

        {/* Right Interactive Map Canvas */}
        <main className="flex-1 h-[50vh] md:h-full relative">
          <MapView
            currentCity={currentCity}
            routeData={routeData}
            errandData={errandData}
          />
        </main>
      </div>
    </div>
  );
};
