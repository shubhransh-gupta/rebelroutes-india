import React, { useState } from 'react';
import { LogOut, ChevronDown, MapPin, Route, Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UserMenu: React.FC = () => {
  const { user, signIn, signOut, isLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) {
    return (
      <button
        onClick={signIn}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-white transition-all disabled:opacity-60"
      >
        {isLoading ? (
          <span className="animate-pulse">Signing in…</span>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Sign in with Google</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-500/30 transition-all"
      >
        <img
          src={user.picture}
          alt={user.name}
          className="w-6 h-6 rounded-full border border-emerald-400/50"
          referrerPolicy="no-referrer"
        />
        <span className="text-xs font-semibold text-emerald-300 hidden sm:block max-w-[90px] truncate">
          {user.name.split(' ')[0]}
        </span>
        <ChevronDown className="w-3 h-3 text-emerald-400" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Profile header */}
          <div className="p-4 border-b border-dark-800 flex items-center gap-3">
            <img
              src={user.picture}
              alt={user.name}
              className="w-10 h-10 rounded-full border-2 border-emerald-500/40"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-sm font-bold text-slate-100 leading-tight">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-2">
            <div className="px-3 py-2 text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">
              Your Benefits
            </div>
            <div className="space-y-0.5">
              {[
                { icon: Route, label: 'Saved Routes', sublabel: 'Coming soon', disabled: true },
                { icon: MapPin, label: 'Favourite Corridors', sublabel: 'Coming soon', disabled: true },
                { icon: Bookmark, label: 'Journey History', sublabel: 'Coming soon', disabled: true },
              ].map(({ icon: Icon, label, sublabel, disabled }) => (
                <div
                  key={label}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs ${
                    disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-dark-800 cursor-pointer'
                  }`}
                >
                  <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-200">{label}</p>
                    <p className="text-[10px] text-slate-500">{sublabel}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dark-800 mt-2 pt-2">
              <button
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
