import React, { useState, useEffect } from 'react';
import { Clock, Sparkles } from 'lucide-react';
import { EtaForecastResponse } from '../types';
import { fetchForecast } from '../services/api';

interface ForecastChartProps {
  baselineMinutes: number;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ baselineMinutes }) => {
  const [data, setData] = useState<EtaForecastResponse | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<any | null>(null);

  useEffect(() => {
    if (baselineMinutes > 0) {
      fetchForecast(baselineMinutes)
        .then((res) => {
          setData(res);
          if (res.forecast.length > 0) {
            setSelectedBucket(res.forecast[2]); // Default highlight
          }
        })
        .catch(console.error);
    }
  }, [baselineMinutes]);

  if (!data) return null;

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>24-Hour Departure Window Radar</span>
        </h3>
        <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full font-medium">
          Traffic Waves
        </span>
      </div>

      <div className="bg-dark-950 border border-cyan-900/30 rounded-xl p-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Optimal Departure Window
          </span>
          <span className="text-sm font-bold text-emerald-400">{data.best_time_to_leave}</span>
        </div>
        <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
      </div>

      {/* Hourly Bar Histogram */}
      <div className="pt-2">
        <div className="flex items-end gap-1 h-24 px-1">
          {data.forecast.map((b, i) => {
            const maxVal = Math.max(...data.forecast.map((f) => f.estimated_duration_minutes));
            const heightPercent = Math.round((b.estimated_duration_minutes / maxVal) * 100);

            let barColor = 'bg-emerald-500/70 hover:bg-emerald-400';
            if (b.traffic_level === 'gridlock') {
              barColor = 'bg-rose-500 hover:bg-rose-400';
            } else if (b.traffic_level === 'heavy') {
              barColor = 'bg-orange-500 hover:bg-orange-400';
            } else if (b.traffic_level === 'moderate') {
              barColor = 'bg-amber-500 hover:bg-amber-400';
            }

            const isSelected = selectedBucket?.time_str === b.time_str;

            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedBucket(b)}
                className={`flex-1 rounded-t transition-all relative group flex flex-col justify-end ${
                  isSelected ? 'ring-2 ring-white scale-105 z-10' : ''
                }`}
                style={{ height: '100%' }}
              >
                <div
                  className={`w-full rounded-t transition-all ${barColor}`}
                  style={{ height: `${heightPercent}%` }}
                />
              </button>
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] text-slate-500 px-1 mt-1 font-mono">
          <span>06:00 AM</span>
          <span>12:00 PM</span>
          <span>06:00 PM</span>
          <span>11:00 PM</span>
        </div>
      </div>

      {/* Detail on selected bucket */}
      {selectedBucket && (
        <div className="bg-dark-950/80 border border-dark-800 rounded-xl p-2.5 text-xs flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-200">{selectedBucket.time_str}</span>
            <p className="text-[11px] text-slate-400">{selectedBucket.advice}</p>
          </div>
          <div className="text-right">
            <span className="font-black text-sm text-slate-100">
              {Math.round(selectedBucket.estimated_duration_minutes)}m
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              {selectedBucket.traffic_level}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
