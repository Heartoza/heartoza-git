import React from "react";
import {Link} from "react-router-dom";
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
          <Link to="/cart" className="cart-btn">🛒</Link>
          <Link to="/login" className="login-btn">Đăng nhập</Link>
          <Link to="/register" className="register-btn">Đăng ký</Link>
        </div>
    </header>

    {/* THANH MENU DUOI */}
    <nav className="nav-menu">
        <Link to="/">Trang chủ</Link>
        <Link to="/products">Danh sách quà</Link>
        {/* <a>Combo quà</a> */}
        <Link to="/about">Về Heartoza</Link>
        <Link to="/contact">Liên hệ</Link>
    </nav>
    </>
  );
}

export default Header;
