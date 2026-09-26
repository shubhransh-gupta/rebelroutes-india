import React, { useState } from 'react';
import { Coffee, Fuel, CreditCard, Cross, ShoppingBag, Check } from 'lucide-react';
import { MultiStopTodoResponse } from '../types';
import { planMultiStopErrands } from '../services/api';

interface ErrandPlannerProps {
  cityId: string;
  pickup: { name: string; lat: number; lng: number } | null;
  destination: { name: string; lat: number; lng: number } | null;
  onErrandsCalculated: (res: MultiStopTodoResponse) => void;
}

const ERRAND_OPTIONS = [
  { id: 'chai', label: 'Chai / Coffee', icon: Coffee },
  { id: 'fuel', label: 'Petrol Pump', icon: Fuel },
  { id: 'atm', label: 'Cash ATM', icon: CreditCard },
  { id: 'pharmacy', label: 'Pharmacy', icon: Cross },
  { id: 'grocery', label: 'Quick Grocery', icon: ShoppingBag },
];

export const ErrandPlanner: React.FC<ErrandPlannerProps> = ({
  cityId,
  pickup,
  destination,
  onErrandsCalculated,
}) => {
  const [selectedTodos, setSelectedTodos] = useState<string[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);

  const toggleTodo = (id: string) => {
    setSelectedTodos((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleCompute = async () => {
    if (!pickup || !destination || selectedTodos.length === 0) return;
    setIsPlanning(true);
    try {
      const res = await planMultiStopErrands({
        city_id: cityId,
        pickup,
        destination,
        todos: selectedTodos,
      });
      onErrandsCalculated(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
          <Coffee className="w-4 h-4 text-emerald-400" />
          <span>Smart On-The-Way Errands</span>
        </h3>
        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full font-medium">
          Zero-Detour
        </span>
      </div>

      <p className="text-[11px] text-slate-400">
        Need a quick stop? We find high-rated spots directly along your travel corridor without costly U-turns.
      </p>

      <div className="flex flex-wrap gap-1.5 pt-1">
        {ERRAND_OPTIONS.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedTodos.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleTodo(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                isSelected
                  ? 'bg-emerald-500 text-dark-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-dark-950 hover:bg-dark-800 text-slate-300 border border-dark-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
            </button>
          );
        })}
      </div>

      {selectedTodos.length > 0 && (
        <button
          type="button"
          onClick={handleCompute}
          disabled={isPlanning || !pickup || !destination}
          className="w-full mt-2 py-2 px-3 rounded-xl bg-dark-800 hover:bg-dark-700 text-xs text-emerald-400 font-bold border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors"
        >
          {isPlanning ? 'Calculating Minimal Detour...' : `Plot ${selectedTodos.length} Stops Along Corridor`}
        </button>
      )}
    </div>
  );
};
