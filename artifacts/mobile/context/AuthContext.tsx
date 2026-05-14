import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { api, setTokenGetter } from '@/lib/api';
import type { UserInfo } from '@/lib/types';

interface AuthContextType {
  user: UserInfo | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: UserInfo) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserInfo) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  setUser: () => {},
});

const TOKEN_KEY = '@budgetsmart_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    setTokenGetter(() => tokenRef.current);
  }, []);

  useEffect(() => {
    tokenRef.current = token;
    setTokenGetter(() => tokenRef.current);
  }, [token]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (stored) {
          tokenRef.current = stored;
          setToken(stored);
          setTokenGetter(() => tokenRef.current);
          const me = await api.get<UserInfo>('/auth/me');
          setUserState(me);
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (newToken: string, newUser: UserInfo) => {
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    tokenRef.current = newToken;
    setToken(newToken);
    setUserState(newUser);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    tokenRef.current = null;
    setToken(null);
    setUserState(null);
  }, []);

  const setUser = useCallback((u: UserInfo) => {
    setUserState(u);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
