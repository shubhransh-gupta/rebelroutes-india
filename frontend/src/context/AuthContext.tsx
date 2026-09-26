import React, { useState, useEffect, createContext, useContext } from 'react';

// ---------- Types ----------
interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

interface AuthContextType {
  user: GoogleUser | null;
  signIn: () => void;
  signOut: () => void;
  isLoading: boolean;
}

// ---------- Context ----------
const AuthContext = createContext<AuthContextType>({
  user: null,
  signIn: () => {},
  signOut: () => {},
  isLoading: false,
});

export const useAuth = () => useContext(AuthContext);

// ---------- Google OAuth helper ----------
// Uses Google Identity Services (GSI) — completely free, no billing required.
// CLIENT_ID is injected via VITE_GOOGLE_CLIENT_ID env var.
// If not set, sign-in gracefully shows a "coming soon" message.
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const STORAGE_KEY = 'rebelroutes_user';

function loadUserFromStorage(): GoogleUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function decodeJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return {};
  }
}

// ---------- Provider ----------
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<GoogleUser | null>(loadUserFromStorage);
  const [isLoading, setIsLoading] = useState(false);

  // Load Google Identity Services script once
  useEffect(() => {
    if (!CLIENT_ID || document.getElementById('gsi-script')) return;
    const script = document.createElement('script');
    script.id = 'gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  const signIn = () => {
    if (!CLIENT_ID) {
      alert(
        'Google Sign-In is not configured yet.\n\n' +
        'To enable it:\n' +
        '1. Go to console.cloud.google.com\n' +
        '2. Create OAuth 2.0 credentials\n' +
        '3. Add VITE_GOOGLE_CLIENT_ID to Vercel env vars\n\n' +
        'The map works perfectly without sign-in — it uses free OpenStreetMap tiles!'
      );
      return;
    }

    setIsLoading(true);

    // @ts-expect-error — google GSI loaded at runtime
    if (typeof google === 'undefined') {
      setTimeout(signIn, 500); // wait for script load
      return;
    }

    // @ts-expect-error — google GSI
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (response: { credential: string }) => {
        const payload = decodeJwt(response.credential) as {
          sub: string;
          name: string;
          email: string;
          picture: string;
        };
        const googleUser: GoogleUser = {
          id: payload.sub,
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
        };
        setUser(googleUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(googleUser));
        setIsLoading(false);
      },
    });

    // @ts-expect-error — google GSI
    google.accounts.id.prompt();
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    // @ts-expect-error — google GSI
    if (typeof google !== 'undefined') {
      // @ts-expect-error — google GSI
      google.accounts.id.disableAutoSelect();
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
