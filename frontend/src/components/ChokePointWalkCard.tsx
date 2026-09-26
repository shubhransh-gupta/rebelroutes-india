import React from 'react';
import { AlertOctagon, Footprints, Car, Lightbulb } from 'lucide-react';
import { ChokeBypassOption } from '../types';

interface ChokePointWalkCardProps {
  bypasses: ChokeBypassOption[];
}

export const ChokePointWalkCard: React.FC<ChokePointWalkCardProps> = ({ bypasses }) => {
  if (!bypasses || bypasses.length === 0) return null;

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
          <AlertOctagon className="w-4 h-4 text-orange-400" />
          <span>Choke Point Bypasses ({bypasses.length} Detected)</span>
        </h3>
        <span className="text-[10px] text-orange-300 bg-orange-950/60 border border-orange-800/40 px-2 py-0.5 rounded-full font-semibold">
          Walk & Rebook
        </span>
      </div>

      <div className="space-y-3">
        {bypasses.map((bp, i) => (
          <div
            key={i}
            className="bg-dark-950 border border-orange-900/40 rounded-xl p-3.5 space-y-2.5 relative overflow-hidden"
          >
            {/* Choke Title & Saved Minutes */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">
                  Bottleneck #{i + 1}
                </span>
                <h4 className="text-sm font-bold text-slate-100">{bp.choke_name}</h4>
              </div>
              <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-lg">
                Save ~{Math.round(bp.net_time_saved_seconds / 60)} mins
              </span>
            </div>

            {/* Insider Advice */}
            <div className="bg-dark-900 border border-dark-800 rounded-lg p-2.5 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/90 leading-relaxed font-medium">
                {bp.bypass_advice}
              </p>
            </div>

            {/* Micro Multimodal Action Steps */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
              <div className="bg-dark-900/80 p-2 rounded-lg border border-dark-800">
                <Car className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
                <span className="text-[10px] text-slate-400 block font-semibold">Step 1: Alight</span>
                <span className="text-[11px] text-slate-200 font-medium">Before choke</span>
              </div>

              <div className="bg-orange-950/40 p-2 rounded-lg border border-orange-800/40">
                <Footprints className="w-3.5 h-3.5 text-orange-400 mx-auto mb-1" />
                <span className="text-[10px] text-orange-400 block font-semibold">Step 2: Walk</span>
                <span className="text-[11px] text-orange-200 font-bold">{bp.walk_distance_meters}m</span>
              </div>

              <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
                <Car className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                <span className="text-[10px] text-emerald-400 block font-semibold">Step 3: Rebook</span>
                <span className="text-[11px] text-emerald-200 font-bold">Clear arterial</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
