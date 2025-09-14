import React from "react";
import logo from "../assets/Heartoza-Logo-Demo.png";
import "./css/Header.css";

function Header() {
  return (
    <>
    {/* HEADER TREN */}
    <header className="header">
        {/*Logo + ten*/}
        <div className="header-left">
            <img src={logo} alt="logo" className="logo"/>
            <h1 className="site-name">Heartoza</h1>
        </div>

        {/*Search bar*/}
        <div className="header-search">
            <input type="text" placeholder="🔍Tìm kiếm món quà mà bạn mong muốn🎁"/>
        </div>

        {/*Login + cart*/}
        <div className="header-right">
            <a href="/cart" className="cart-btn">🛒</a>
            <a href="/login" className="login-btn">Đăng nhập</a>
            <a href="/register" className="register-btn">Đăng ký</a>
            </div>
    </header>

    {/* THANH MENU DUOI */}
    <nav className="nav-menu">
        <a href="/">Trang chủ</a>
        <a href="/gifts">Danh sách quà</a>
        {/* <a>Combo quà</a> */}
        <a href="/about">Về Heartoza</a>
        <a href="/contact">Liên hệ</a>
    </nav>
    </>
  );
}

export default Header;
