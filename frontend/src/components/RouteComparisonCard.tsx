import React from 'react';
import { Footprints, CheckCircle2, Navigation2, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { OptimalRouteResponse } from '../types';

interface RouteComparisonCardProps {
  routeData: OptimalRouteResponse;
}

export const RouteComparisonCard: React.FC<RouteComparisonCardProps> = ({ routeData }) => {
  const isClearRoads = routeData.total_time_saved_minutes <= 1;
  const percentSaved =
    routeData.direct_duration_minutes > 0
      ? Math.round((routeData.total_time_saved_minutes / routeData.direct_duration_minutes) * 100)
      : 0;

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* 1. Main Recommendation Banner in Plain English */}
      <div
        className={`border rounded-xl p-3.5 ${
          isClearRoads
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : 'bg-gradient-to-r from-emerald-950/60 to-dark-950 border-emerald-500/40 text-slate-100'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-xl shrink-0 mt-0.5 ${
              isClearRoads ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500 text-dark-950'
            }`}
          >
            {isClearRoads ? <CheckCircle2 className="w-5 h-5" /> : <Navigation2 className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-dark-900/80 border border-dark-700 text-emerald-400">
                {isClearRoads ? 'Direct Route Recommended' : 'Rebel Route Saves Time'}
              </span>
              {routeData.time_of_day_note && (
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{routeData.time_of_day_note}</span>
                </span>
              )}
            </div>
            <p className="text-sm font-semibold leading-snug text-slate-100">
              {routeData.verdict}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Side-by-Side Commute Comparison */}
      <div className="grid grid-cols-2 gap-3">
        {/* Direct Route Card */}
        <div
          className={`border rounded-xl p-3 flex flex-col justify-between ${
            isClearRoads
              ? 'bg-emerald-950/20 border-emerald-500/30'
              : 'bg-dark-950/70 border-dark-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Direct Drive
              </span>
              {isClearRoads && (
                <span className="text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                  Fastest
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-200">
                {Math.round(routeData.direct_duration_minutes)}
              </span>
              <span className="text-xs text-slate-400 font-medium">mins</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-tight">
            {isClearRoads
              ? 'No bottleneck delays at this hour'
              : 'Stuck at campus exit & traffic signals'}
          </p>
        </div>

        {/* Rebel Optimal Card */}
        <div
          className={`border rounded-xl p-3 flex flex-col justify-between ${
            !isClearRoads
              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-sm'
              : 'bg-dark-950/40 border-dark-800 opacity-60'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                Rebel Route
              </span>
              {percentSaved > 0 && (
                <span className="text-[10px] font-extrabold uppercase bg-emerald-500 text-dark-950 px-2 py-0.5 rounded-full shrink-0 shadow-sm">
                  {percentSaved}% Faster
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-400">
                {Math.round(routeData.rebel_duration_minutes)}
              </span>
              <span className="text-xs text-emerald-400 font-medium">mins</span>
            </div>
          </div>
          <p className="text-[11px] text-emerald-300/90 font-medium mt-2 leading-tight">
            {percentSaved > 0
              ? `Saves ~${Math.round(routeData.total_time_saved_minutes)} mins total`
              : 'Same as direct (roads clear)'}
          </p>
        </div>
      </div>

      {/* 3. Actionable What-To-Do Steps in Everyday English */}
      {routeData.simple_action_steps && routeData.simple_action_steps.length > 0 && (
        <div className="bg-dark-950 border border-dark-800 rounded-xl p-3.5 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>How to do it:</span>
          </p>
          <ul className="space-y-2">
            {routeData.simple_action_steps.map((step, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed"
              >
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Smart Walk-to-Road Pickup Detail (if applicable) */}
      {routeData.pickup_arbitrage && (
        <div className="bg-dark-950 border border-cyan-900/40 rounded-xl p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5 text-cyan-400" />
              <span>Smart Pickup Spot</span>
            </span>
            <span className="text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full font-medium">
              Save {Math.round(routeData.pickup_arbitrage.time_saved_seconds / 60)} mins
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {routeData.pickup_arbitrage.reason}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
            <span>Walk distance: <strong className="text-slate-200">{routeData.pickup_arbitrage.walk_distance_meters}m</strong></span>
            <span>•</span>
            <span>Walk time: <strong className="text-slate-200">~{Math.round(routeData.pickup_arbitrage.walk_duration_seconds / 60)} min</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
