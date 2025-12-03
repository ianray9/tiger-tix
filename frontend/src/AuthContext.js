import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);

    // Run after login
    function login(newToken, userInfo) {
        setToken(newToken);
        setUser(userInfo);
    }

    // Run during logout
    function logout() {
        setToken(null);
        setUser(null);
    }

    const isAuthenticated = !!token; // Boolean

    return (
        <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
