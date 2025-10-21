import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function RequireAdmin({ children }) {
    const { user } = useContext(AuthContext);
    const loc = useLocation();
    if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;
    if (user.role !== "Admin") return <Navigate to="/" replace />;
    return children;
}
