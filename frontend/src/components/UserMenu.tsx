import React, { useState } from 'react';
import { LogOut, ChevronDown, MapPin, Route, Bookmark, AlertCircle, X, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UserMenu: React.FC = () => {
  const { user, signIn, signOut, isLoading, authError, clearError } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative">
      {!user ? (
        <div className="flex items-center gap-2">
          <button
            onClick={signIn}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-xs font-semibold text-white transition-all shadow-sm disabled:opacity-60"
            title="Sign in with your Google account"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Connecting…</span>
              </span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
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
        </div>
      ) : (
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 transition-all shadow-sm"
        >
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-6 h-6 rounded-full border border-emerald-400/50 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs font-semibold text-emerald-300 hidden sm:block max-w-[100px] truncate">
            {user.name.split(' ')[0]}
          </span>
          <ChevronDown className="w-3 h-3 text-emerald-400" />
        </button>
      )}

      {/* Auth Error Notification Modal */}
      {authError && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-dark-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3.5 shadow-2xl z-50 text-xs">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Google Sign-In Setup</span>
            </div>
            <button
              onClick={clearError}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-slate-300 mb-2 leading-relaxed">{authError}</p>
          <div className="bg-dark-950/80 p-2 rounded-xl text-[11px] text-slate-400 border border-dark-800 space-y-1">
            <p className="font-medium text-slate-200">To allow Google Sign-In:</p>
            <p>1. Open Google Cloud Console &gt; Credentials</p>
            <p>2. Add Authorized JavaScript Origin:</p>
            <code className="text-emerald-300 block select-all bg-dark-900 px-1.5 py-0.5 rounded text-[10px]">
              {typeof window !== 'undefined' ? window.location.origin : 'https://rebelroutes-india.vercel.app'}
            </code>
          </div>
          <div className="mt-2.5 flex justify-end">
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium"
            >
              <span>Open Google Cloud Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* User Dropdown */}
      {user && menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-dark-900/95 backdrop-blur-md border border-dark-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Profile header */}
          <div className="p-4 border-b border-dark-800 flex items-center gap-3">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-10 h-10 rounded-full border-2 border-emerald-500/40 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-100 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 rounded-md border border-emerald-500/30">
                Connected via Google
              </span>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-2">
            <div className="px-3 py-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              Rebel Passenger Perks
            </div>
            <div className="space-y-0.5">
              {[
                { icon: Route, label: 'Saved Bypass Routes', sublabel: 'Auto-syncs across your devices' },
                { icon: MapPin, label: 'Frequent Choke Alerts', sublabel: 'Notify me before departure' },
                { icon: Bookmark, label: 'Trip Savings Diary', sublabel: 'Track total commute minutes saved' },
              ].map(({ icon: Icon, label, sublabel }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs hover:bg-dark-800/70 cursor-pointer transition-colors"
                >
                  <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-200">{label}</p>
                    <p className="text-[10px] text-slate-400">{sublabel}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dark-800 mt-2 pt-2">
              <button
                onClick={() => {
                  signOut();
                  setMenuOpen(false);
                }}
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
