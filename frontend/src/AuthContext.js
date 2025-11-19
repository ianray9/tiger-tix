import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // { id, email }
  const [token, setToken] = useState(null); // JWT string

  function login(userData, jwtToken) {
    setUser(userData);
    setToken(jwtToken);
  }

  function logout() {
    setUser(null);
    setToken(null);
  }

  const value = { user, token, login, logout, isAuthenticated: !!token };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
