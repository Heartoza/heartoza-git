import React, { createContext, useMemo, useState } from "react";
import http from "../services/api";

export const AuthContext = createContext({
    user: null,
    token: null,
    login: () => { },
    logout: () => { },
});

export default function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [user, setUser] = useState(() => {
        const raw = localStorage.getItem("user");
        return raw ? JSON.parse(raw) : null; // { userId, email, fullName, role }
    });

    const login = (t, u, refreshToken) => {
        localStorage.setItem("token", t);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(u));
        setToken(t);
        setUser(u);
        // set header cho axios instance
        http.defaults.headers.common.Authorization = `Bearer ${t}`;
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        delete http.defaults.headers.common.Authorization;
        setToken(null);
        setUser(null);
    };

    const value = useMemo(() => ({ user, token, login, logout }), [user, token]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
