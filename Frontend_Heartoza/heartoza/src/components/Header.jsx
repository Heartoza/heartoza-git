import React from "react";
import { NavLink } from "react-router-dom";
import logo from "../assets/Heartoza-Logo-Demo.png";
import "./css/Header.css";

function Header() {
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
          <NavLink to="/login" className="login-btn">Đăng nhập</NavLink>
          <NavLink to="/register" className="register-btn">Đăng ký</NavLink>
        </div>
      </header>

      {/* THANH MENU DƯỚI */}
      <nav className="nav-menu">
        <NavLink to="/" end>Trang chủ</NavLink>
        <NavLink to="/products">Danh sách quà</NavLink>
        <NavLink to="/about">Về Heartoza</NavLink>
        <NavLink to="/contact">Liên hệ</NavLink>
      </nav>
    </>
  );
}

export default Header;
