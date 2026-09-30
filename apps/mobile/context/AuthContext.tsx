import { apiFetch } from '@/services/api';
import { clearSession, loadSession, saveSession, SessionUser, subscribeSession } from '@/services/session';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

type AuthResponse = {
  token: string;
  user: { id: string; email: string; name: string };
};

type AuthContextType = {
  user: SessionUser | null;
  loading: boolean;
  googleLoading: boolean;
  googleReady: boolean;
  isGoogleNewUser: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  promptGoogleSignIn: (onNewUser?: () => void | Promise<void>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toSession(user: AuthResponse['user']): SessionUser {
  return { uid: user.id, email: user.email, displayName: user.name };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadSession()
      .then(async (stored) => {
        if (!stored) return;
        if (active) setUser(stored);
        const profile = await apiFetch<AuthResponse['user']>('/v1/auth/me');
        const next = toSession(profile);
        if (active) setUser(next);
      })
      .catch(async () => {
        await clearSession();
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const unsubscribe = subscribeSession((next) => setUser(next));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const result = await apiFetch<AuthResponse>('/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          name: '',
        }),
      });
      await saveSession(result.token, toSession(result.user));
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await apiFetch<AuthResponse>('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await saveSession(result.token, toSession(result.user));
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const promptGoogleSignIn = async () => ({
    error: new Error('Google sign-in has been removed. Use email and password.'),
  });

  const resetPassword = async () => ({
    error: new Error('Password reset is not available. Create a new account or contact an admin.'),
  });

  const signOut = async () => {
    await clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        googleLoading: false,
        googleReady: false,
        isGoogleNewUser: false,
        signUp,
        signIn,
        promptGoogleSignIn,
        resetPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
