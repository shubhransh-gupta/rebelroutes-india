import React from 'react';
import { Compass, Flame, ShieldCheck, Github } from 'lucide-react';
import { City } from '../types';

interface HeaderProps {
  currentCity: City | null;
}

export const Header: React.FC<HeaderProps> = ({ currentCity }) => {
  return (
    <header className="h-16 border-b border-dark-700 bg-dark-900/90 backdrop-blur-md px-4 md:px-6 flex items-center justify-between z-30 relative">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Compass className="w-6 h-6 text-white animate-spin-slow" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-lg text-white font-mono">
              RebelRoutes<span className="text-emerald-400">.in</span>
            </span>
            <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
              FIT (Fantastic Indian Traffic)
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            The open routing lab arguing with Google Maps across India
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {currentCity && (
          <div className="hidden lg:flex items-center gap-2 bg-dark-800/80 border border-dark-700 px-3 py-1.5 rounded-lg text-xs">
            <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
            <span className="text-slate-300">Live Chokes in {currentCity.name}:</span>
            <span className="font-semibold text-orange-400">{currentCity.choke_points.length} hotspots mapped</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs px-2.5 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4" />
          <span className="font-medium hidden sm:inline">100% Free Public Service</span>
        </div>

        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white transition-colors"
          title="Source Code"
        >
          <Github className="w-5 h-5" />
        </a>
      </div>
    </header>
  );
};
