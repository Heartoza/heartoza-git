import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import logo from "../../assets/logo/Logo-Demo.png";
import "../css/Header.css";
import { AuthContext } from "../../context/AuthContext";

function Header() {
    const { user, logout } = useContext(AuthContext);

    return (
        <>
            {/* HEADER TRÊN */}
            <header className="header">
                <div className="header-left">
                    <img src={logo} alt="logo" className="logo" />
                    <h1 className="site-name">Heartoza</h1>
                </div>

                <div className="header-search">
                    <input type="text" placeholder="🔍 Tìm kiếm món quà..." />
                </div>

                <div className="header-right">
                    <NavLink to="/cart" className="cart-btn">🛒</NavLink>

                    {!user ? (
                        <>
                            <NavLink to="/login" className="login-btn">Đăng nhập</NavLink>
                            <NavLink to="/register" className="register-btn">Đăng ký</NavLink>
                        </>
                    ) : (
                        <div className="user-menu">
                            <span className="user-name">👤 {user.fullName || user.email}</span>
                            <NavLink to="/profile" className="profile-btn">Hồ sơ</NavLink>
                            <button onClick={logout} className="logout-btn">Đăng xuất</button>
                        </div>
                    )}
                </div>
            </header>

            {/* THANH MENU DƯỚI */}
            <nav className="nav-menu">
                <NavLink to="/" end>Trang chủ</NavLink>
                <NavLink to="/products">Danh sách quà</NavLink>
                <NavLink to="/about">Về Heartoza</NavLink>
                <NavLink to="/contact">Liên hệ</NavLink>
                {user && <NavLink to="/orders">Đơn hàng</NavLink>}
            </nav>
        </>
    );
}

export default Header;
