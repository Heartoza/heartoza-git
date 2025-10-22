import React from "react";
import { Outlet } from "react-router-dom";
import AdminDashboard from "../pages/admin/AdminDashboard"; // chính là file sidebar của anh

export default function AdminLayout() {
    return (
        <div className="admin-shell" style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 24 }}>
            <AdminDashboard />
            <div className="admin-content" style={{ padding: 16 }}>
                <Outlet />
            </div>
        </div>
    );
}
