import React from "react";
import { Link } from "react-router-dom";
import "../css/Admin.css";

export default function AdminDashboard() {
    return (
        <div className="admin-page">
            <h2>Admin Dashboard</h2>
            <div className="admin-grid">
                <Link className="admin-card" to="/admin/users">👥 Quản lý User</Link>
                <Link className="admin-card" to="/admin/orders">📦 Quản lý Order</Link>
                <Link className="admin-card" to="/admin/products">🛍️ Quản lý Product</Link>
                <Link className="admin-card" to="/admin/categories">🗂️ Quản lý Category</Link>
            </div>
        </div>
    );
}
