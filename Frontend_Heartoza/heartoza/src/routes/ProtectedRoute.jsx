import React from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
    const { token, user } = React.useContext(AuthContext);

    // chưa login → đá về login
    if (!token) return <Navigate to="/login" replace />;

    // có role yêu cầu mà user không khớp → đá về home
    if (role && user?.role !== role) {
        return <Navigate to="/" replace />;
    }

    return children;
}
