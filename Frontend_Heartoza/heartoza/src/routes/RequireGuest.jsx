// src/router/RequireGuest.jsx
import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function RequireGuest() {
    const { user } = useContext(AuthContext);

    // Nếu đã login thì chuyển hướng về profile (hoặc admin)
    if (user) {
        return <Navigate to={user.role === "Admin" ? "/admin" : "/profile"} replace />;
    }

    // Nếu chưa login thì cho vào mấy route con (login, register, forgot)
    return <Outlet />;
}
