import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearToken, getMe, getToken, login as apiLogin, register as apiRegister, setToken } from '../api/client';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    setToken(data.access_token);
    setUser({
      id: null,
      email: data.email,
      name: data.name,
      role: data.role,
    });
    await loadUser();
    return data;
  }, [loadUser]);

  const register = useCallback(async (payload) => {
    const data = await apiRegister(payload);
    setToken(data.access_token);
    await loadUser();
    return data;
  }, [loadUser]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'admin',
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser: loadUser,
    }),
    [user, loading, login, register, logout, loadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
