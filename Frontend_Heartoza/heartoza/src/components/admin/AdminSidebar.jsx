import React from "react";
import { Link } from "react-router-dom";
import "../css/Admin.css";

export default function AdminSidebar() {
    return (
        <aside className="admin-sidebar">
            <h3>Admin Panel</h3>
            <nav>
                <ul>
                    <li><Link to="/admin/users">👥 Users</Link></li>
                    <li><Link to="/admin/orders">📦 Orders</Link></li>
                    <li><Link to="/admin/products">🛍️ Products</Link></li>
                    <li><Link to="/admin/categories">🗂️ Categories</Link></li>
                </ul>
            </nav>
        </aside>
    );
}
