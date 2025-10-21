// src/router/ProtectedRoute.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
    const { token, user } = useContext(AuthContext);

    // chưa login hoặc chưa có user → đá về login
    if (!token || !user) return <Navigate to="/login" replace />;

    // có role yêu cầu mà user không khớp → đá về home
    if (role && user.role !== role) {
        return <Navigate to="/" replace />;
    }

    return children;
}
