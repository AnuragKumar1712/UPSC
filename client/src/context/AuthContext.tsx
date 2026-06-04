import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../services/api';

interface AuthContextType {
  username: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then((u) => setUsername(u.username))
      .catch(() => setUsername(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (user: string, pass: string) => {
    const res = await api.login(user, pass);
    setUsername(res.username);
  };

  const logout = async () => {
    await api.logout();
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ username, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
