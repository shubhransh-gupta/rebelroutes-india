import React from 'react';
import { MapPin } from 'lucide-react';
import { City } from '../types';

interface CitySelectorProps {
  cities: City[];
  selectedCity: City | null;
  onSelectCity: (city: City) => void;
}

export const CitySelector: React.FC<CitySelectorProps> = ({
  cities,
  selectedCity,
  onSelectCity,
}) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2.5 px-4 bg-dark-900 border-b border-dark-800">
      <div className="flex items-center gap-2 min-w-max">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active City:</span>
        </div>
        {cities.map((city) => {
          const isSelected = selectedCity?.id === city.id;
          return (
            <button
              key={city.id}
              onClick={() => onSelectCity(city)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-emerald-500 text-dark-950 font-semibold shadow-md shadow-emerald-500/20'
                  : 'bg-dark-800 text-slate-300 hover:bg-dark-700 hover:text-white border border-dark-700'
              }`}
            >
              <span>{city.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-dark-950/30 text-dark-950' : 'bg-dark-900 text-slate-400'
              }`}>
                {city.choke_points.length} chokes
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
