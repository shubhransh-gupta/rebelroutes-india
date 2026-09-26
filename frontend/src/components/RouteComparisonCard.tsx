import React from 'react';
import { Footprints, CheckCircle2 } from 'lucide-react';
import { OptimalRouteResponse } from '../types';

interface RouteComparisonCardProps {
  routeData: OptimalRouteResponse;
}

export const RouteComparisonCard: React.FC<RouteComparisonCardProps> = ({ routeData }) => {
  const percentSaved = Math.round(
    (routeData.total_time_saved_minutes / routeData.direct_duration_minutes) * 100
  );

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Verdict Header */}
      <div className="bg-gradient-to-r from-emerald-950/60 to-dark-950 border border-emerald-500/30 rounded-xl p-3">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-emerald-300">REBEL VERDICT</p>
            <p className="text-sm font-semibold text-slate-100 mt-0.5 leading-snug">
              {routeData.verdict}
            </p>
          </div>
        </div>
      </div>

      {/* Head to Head Numbers */}
      <div className="grid grid-cols-2 gap-3">
        {/* Google Direct */}
        <div className="bg-dark-950/70 border border-dark-800 rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
            Standard Google Maps
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-400">
              {Math.round(routeData.direct_duration_minutes)}
            </span>
            <span className="text-xs text-slate-500 font-medium">mins</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            Trapped in curbside & gate queues
          </span>
        </div>

        {/* Rebel Route */}
        <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-extrabold uppercase bg-emerald-500 text-dark-950 px-2 py-0.5 rounded-full">
              {percentSaved}% Faster
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block mb-1">
            Rebel Optimal Route
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-400">
              {Math.round(routeData.rebel_duration_minutes)}
            </span>
            <span className="text-xs text-emerald-500 font-medium">mins</span>
          </div>
          <span className="text-[11px] text-emerald-400/90 font-medium block mt-1">
            Saves ~{Math.round(routeData.total_time_saved_minutes)} mins
          </span>
        </div>
      </div>

      {/* Shifted Pickup Arbitrage Box */}
      {routeData.pickup_arbitrage && (
        <div className="bg-dark-950 border border-dark-800 rounded-xl p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5 text-cyan-400" />
              <span>Boundary Pickup Shift</span>
            </span>
            <span className="text-[10px] text-cyan-400 bg-cyan-950/50 border border-cyan-800/40 px-2 py-0.5 rounded-full font-medium">
              Save {Math.round(routeData.pickup_arbitrage.time_saved_seconds / 60)} mins
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            {routeData.pickup_arbitrage.reason}
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
            <span>Walk distance: <strong>{routeData.pickup_arbitrage.walk_distance_meters}m</strong></span>
            <span>•</span>
            <span>Walk time: <strong>{Math.round(routeData.pickup_arbitrage.walk_duration_seconds / 60)} mins</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
