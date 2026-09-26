import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';

// ---------- Types ----------
export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
  accessToken?: string;
}

interface AuthContextType {
  user: GoogleUser | null;
  signIn: () => void;
  signOut: () => void;
  isLoading: boolean;
  clientId: string;
  authError: string | null;
  clearError: () => void;
}

// ---------- Context ----------
const AuthContext = createContext<AuthContextType>({
  user: null,
  signIn: () => {},
  signOut: () => {},
  isLoading: false,
  clientId: '',
  authError: null,
  clearError: () => {},
});

export const useAuth = () => useContext(AuthContext);

// Google OAuth Client ID provided by user
const CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '657015210933-8l9ameosq26ngdav4u0ctlcec00i8337.apps.googleusercontent.com';

const STORAGE_KEY = 'rebelroutes_google_user';

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
  const [authError, setAuthError] = useState<string | null>(null);

  const clearError = () => setAuthError(null);

  const handleUserAuthenticated = useCallback((userData: GoogleUser) => {
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setAuthError(null);
    setIsLoading(false);
  }, []);

  // Initialize Google One Tap on mount if not already logged in
  useEffect(() => {
    if (user || typeof window === 'undefined') return;

    const initOneTap = () => {
      // @ts-expect-error Google GSI global
      const google = window.google;
      if (!google?.accounts?.id || !CLIENT_ID) return;

      try {
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response: { credential: string }) => {
            const payload = decodeJwt(response.credential) as {
              sub: string;
              name?: string;
              email?: string;
              picture?: string;
            };
            handleUserAuthenticated({
              id: payload.sub,
              name: payload.name || payload.email?.split('@')[0] || 'Google User',
              email: payload.email || '',
              picture: payload.picture || '',
            });
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Prompt One-Tap non-intrusively
        google.accounts.id.prompt();
      } catch (err) {
        console.warn('One Tap auto-prompt skipped:', err);
      }
    };

    // If script already loaded, initialize immediately
    // @ts-expect-error Google GSI global
    if (window.google?.accounts?.id) {
      initOneTap();
    } else {
      const timer = setTimeout(initOneTap, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, handleUserAuthenticated]);

  // Explicit Sign-In triggered by button click
  const signIn = () => {
    setAuthError(null);
    setIsLoading(true);

    // @ts-expect-error Google GSI global
    const google = typeof window !== 'undefined' ? window.google : undefined;

    if (!google?.accounts) {
      setIsLoading(false);
      setAuthError('Google Sign-In is initializing. Please click again in a moment.');
      return;
    }

    // Try Google OAuth2 Token Client (best user experience: opens popup with Google account selector)
    if (google.accounts.oauth2) {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid',
          callback: async (tokenResponse: { access_token?: string; error?: string }) => {
            if (tokenResponse.error) {
              console.error('Google OAuth error:', tokenResponse.error);
              setIsLoading(false);
              if (tokenResponse.error === 'access_denied') {
                setAuthError('Sign-in cancelled.');
              } else {
                setAuthError(`Sign-in notice: ${tokenResponse.error}. Ensure this domain is authorized in Google Cloud Console.`);
              }
              return;
            }

            if (tokenResponse.access_token) {
              try {
                // Fetch profile directly from Google
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                if (!res.ok) throw new Error('Failed to fetch user profile');
                const info = await res.json();

                handleUserAuthenticated({
                  id: info.sub,
                  name: info.name || info.given_name || info.email.split('@')[0],
                  email: info.email,
                  picture: info.picture || '',
                  accessToken: tokenResponse.access_token,
                });
              } catch (profileErr) {
                console.error('Failed to get profile:', profileErr);
                setIsLoading(false);
                setAuthError('Could not load user profile from Google.');
              }
            }
          },
          error_callback: (err: { message?: string; type?: string }) => {
            setIsLoading(false);
            setAuthError(
              err.message || 'Google Sign-In failed. Please check Authorized JavaScript Origins in Google Cloud Console.'
            );
          },
        });

        client.requestAccessToken();
        return;
      } catch (clientErr) {
        console.warn('OAuth2 client init failed, falling back to One-Tap prompt:', clientErr);
      }
    }

    // Fallback: google.accounts.id prompt
    if (google.accounts.id) {
      try {
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response: { credential: string }) => {
            const payload = decodeJwt(response.credential) as {
              sub: string;
              name?: string;
              email?: string;
              picture?: string;
            };
            handleUserAuthenticated({
              id: payload.sub,
              name: payload.name || payload.email?.split('@')[0] || 'User',
              email: payload.email || '',
              picture: payload.picture || '',
            });
          },
        });
        google.accounts.id.prompt();
      } catch (promptErr) {
        console.error('Prompt failed:', promptErr);
        setIsLoading(false);
        setAuthError('Could not display Google Sign-In prompt.');
      }
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    // @ts-expect-error Google GSI global
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      // @ts-expect-error Google GSI global
      window.google.accounts.id.disableAutoSelect();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signOut,
        isLoading,
        clientId: CLIENT_ID,
        authError,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
