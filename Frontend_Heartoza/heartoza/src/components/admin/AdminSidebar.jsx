import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import "../css/Admin.css";
import { AuthContext } from "../../context/AuthContext";

export default function AdminDashboard() {
  const {logout } = useContext(AuthContext);
  return (
    <div className="admin-sidebar">
      <h2>Admin Panel</h2>
      <ul className="admin-menu">
        <li>📊 <NavLink to="/admin/dashboard">Thống kê</NavLink></li>
        <li>👥 <NavLink to="/admin/users">Người dùng</NavLink></li>
        <li>📦 <NavLink to="/admin/orders">Đơn hàng</NavLink></li>
        <li>🛍️ <NavLink to="/admin/products">Sản phẩm</NavLink></li>
        <li>🗂️ <NavLink to="/admin/categories">Phân loại sản phẩm</NavLink></li>
        <button onClick={logout} className="logout-btn">Đăng xuất</button>
      </ul>
    </div>
  );
}
