import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setAuthToken, setUnauthorizedHandler } from '../../lib/api';
import { getCurrentUser, login as requestLogin, register as requestRegister, type AuthUser } from './api';

const STORAGE_KEY = 'festival-auth';

interface StoredSession {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredToken(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const session = JSON.parse(stored) as Partial<StoredSession>;
    return typeof session.token === 'string' && session.token.length > 0 ? session.token : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(() => Boolean(readStoredToken()));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
    setLoading(false);
  }, []);

  const saveSession = useCallback((session: { token: string; user: AuthUser }) => {
    setToken(session.token);
    setUser(session.user);
    setAuthToken(session.token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setLoading(false);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    let active = true;
    const storedToken = readStoredToken();
    if (!storedToken) {
      setAuthToken(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setToken(storedToken);
    setAuthToken(storedToken);
    void getCurrentUser()
      .then(({ user: currentUser }) => {
        if (!active) return;
        setUser(currentUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: storedToken, user: currentUser }));
        setLoading(false);
      })
      .catch(() => {
        if (active) logout();
      });

    return () => {
      active = false;
    };
  }, [logout]);

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      saveSession(await requestLogin(input));
    },
    [saveSession],
  );

  const register = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      saveSession(await requestRegister(input));
    },
    [saveSession],
  );

  const value = useMemo(() => ({ token, user, loading, login, register, logout }), [token, user, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
