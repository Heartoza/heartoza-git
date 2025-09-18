import React, { createContext, useEffect, useMemo, useState } from "react";

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
        return raw ? JSON.parse(raw) : null;
        // user = { userId, email, fullName, role }
    });

    // Nếu token không hợp lệ/ hết hạn (BE sẽ 401), FE chỉ cần logout khi cần.
    useEffect(() => {
        if (!token) return;
        // có thể kiểm tra exp trong JWT nếu muốn, ở đây để đơn giản
    }, [token]);

    const login = (t, u) => {
        localStorage.setItem("token", t);
        localStorage.setItem("user", JSON.stringify(u));
        setToken(t);
        setUser(u);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    };

    const value = useMemo(() => ({ user, token, login, logout }), [user, token]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
