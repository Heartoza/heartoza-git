import React, { useContext, useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/logo/1.png";
import "../css/Header.css";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import debounce from "lodash.debounce";

function Header() {
    const { user, logout } = useContext(AuthContext);
    const [searchText, setSearchText] = useState("");
    const navigate = useNavigate();

    // debounce search để gọi API khi người dùng ngừng gõ
    const handleSearch = debounce(async (text) => {
        if (!text.trim()) return;
        try {
            const res = await axios.get("https://localhost:7109/api/Products", {
                params: { q: text, page: 1, pageSize: 10 },
            });
            // res.data.items chứa danh sách sản phẩm khớp
            console.log(res.data.items); // bạn có thể hiển thị dropdown gợi ý ở đây
        } catch (err) {
            console.error(err);
        }
    }, 500);

    useEffect(() => {
        handleSearch(searchText);
        return handleSearch.cancel;
    }, [searchText]);

    const onSearchChange = (e) => setSearchText(e.target.value);
    const onSearchEnter = (e) => {
        if (e.key === "Enter" && searchText.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchText)}`);
            setSearchText("");
        }
    };

    return (
        <>
            <header className="header">
                <div className="header-left">
                    <img src={logo} alt="logo" className="logo" />
                    <h1 className="site-name">Heartoza</h1>
                </div>

                <div className="header-search">
                    <input
                        type="text"
                        placeholder="🔍 Tìm kiếm món quà..."
                        value={searchText}
                        onChange={onSearchChange}
                        onKeyDown={onSearchEnter}
                    />
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
