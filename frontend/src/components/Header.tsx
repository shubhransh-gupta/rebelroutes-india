import React from 'react';
import { Compass, Flame, ShieldCheck, Github } from 'lucide-react';
import { City } from '../types';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  currentCity: City | null;
}

export const Header: React.FC<HeaderProps> = ({ currentCity }) => {
  return (
    <header className="h-14 md:h-16 border-b border-dark-700 bg-dark-900/95 backdrop-blur-md px-3 md:px-6 flex items-center justify-between z-30 relative shrink-0">
      {/* Left: Branding */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
          <Compass className="w-5 h-5 text-white animate-spin-slow" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-tight text-base md:text-lg text-white font-mono truncate">
              RebelRoutes<span className="text-emerald-400">.in</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden lg:block truncate">
            The open-source routing lab outsmarting traffic across Indian cities
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {currentCity && (
          <div className="hidden xl:flex items-center gap-2 bg-dark-800/80 border border-dark-700 px-3 py-1.5 rounded-lg text-xs">
            <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
            <span className="text-slate-300">Live Chokes in {currentCity.name}:</span>
            <span className="font-semibold text-orange-400">{currentCity.choke_points.length} hotspots</span>
          </div>
        )}

        <div className="hidden lg:flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs px-2.5 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4" />
          <span className="font-medium">100% Free Public Service</span>
        </div>

        {/* Creator Badge: Compact on mobile, full on desktop */}
        <div className="flex items-center gap-1 px-2 md:px-2.5 py-1 rounded-full text-[10px] md:text-[11px] font-medium bg-dark-800/90 text-slate-300 border border-dark-700/80 shadow-sm">
          <span className="hidden sm:inline">Created with</span>
          <span className="text-rose-500">❤️</span>
          <span className="hidden sm:inline">by</span>
          <span className="font-semibold text-emerald-400">Shubhransh</span>
          <span className="font-semibold text-emerald-400 hidden sm:inline">Gupta</span>
        </div>

        {/* GitHub: Hidden on small mobile */}
        <a
          href="https://github.com/shubhransh-gupta/rebelroutes-india"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white transition-colors"
          title="Source Code on GitHub"
        >
          <Github className="w-4 h-4 md:w-5 md:h-5" />
        </a>

        {/* User Sign In / Profile */}
        <UserMenu />
      </div>
    </header>
  );
};
