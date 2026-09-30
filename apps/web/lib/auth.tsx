'use client';

import { AuthUser } from '@master-connect/shared';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, getToken, setToken } from './api';

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function storeSession(result: { token: string; user: AuthUser }, setUser: (user: AuthUser) => void, setTokenState: (token: string) => void) {
  setToken(result.token);
  setTokenState(result.token);
  setUser(result.user);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getToken();
    if (!stored) {
      setLoading(false);
      return;
    }
    setTokenState(stored);
    apiFetch<AuthUser>('/v1/auth/me')
      .then(setUser)
      .catch(() => {
        setToken(null);
        setTokenState(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      loading,
      signIn: async (email, password) => {
        const result = await apiFetch<{ token: string; user: AuthUser }>('/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        await storeSession(result, setUser, setTokenState);
      },
      signUp: async (name, email, password) => {
        const result = await apiFetch<{ token: string; user: AuthUser }>('/v1/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        });
        await storeSession(result, setUser, setTokenState);
      },
      logout: () => {
        setToken(null);
        setTokenState(null);
        setUser(null);
      },
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
