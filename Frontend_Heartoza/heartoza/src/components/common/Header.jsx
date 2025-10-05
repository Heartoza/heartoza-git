import React, { useContext, useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/logo/1.png";
import "../css/Header.css";
import { AuthContext } from "../../context/AuthContext";
import debounce from "lodash.debounce";
import http from "../../services/api"; // ✅ dùng client chung (baseURL + token + refresh)

function Header() {
    const { user, logout } = useContext(AuthContext);
    const [searchText, setSearchText] = useState("");
    const [results, setResults] = useState([]);
    const navigate = useNavigate();

    // 🔎 Debounce search (dùng useCallback để giữ ổn định reference)
    const handleSearch = useCallback(
        debounce(async (text) => {
            const q = text.trim();
            if (!q) {
                setResults([]);
                return;
            }
            try {
                const res = await http.get("Products/search", {
                    params: { q },
                    validateStatus: (s) => (s >= 200 && s < 300) || s === 204,
                });
                setResults(res.status === 204 ? [] : res.data?.items || []);
            } catch (err) {
                console.error("Search error:", err?.message || err);
            }
        }, 500),
        []
    );

    useEffect(() => {
        handleSearch(searchText);
        return () => handleSearch.cancel(); // ✅ cleanup debounce
    }, [searchText, handleSearch]);

    const onSearchChange = (e) => setSearchText(e.target.value);
    const onSearchEnter = (e) => {
        if (e.key === "Enter" && searchText.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchText.trim())}`);
            setSearchText("");
            setResults([]);
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
                    {results.length > 0 && (
                        <ul className="search-suggestions">
                            {results.map((item) => (
                                <li
                                    key={item.productId}
                                    onClick={() => {
                                        navigate(`/products/${item.productId}`);
                                        setSearchText("");
                                        setResults([]);
                                    }}
                                >
                                    {item.name} - {item.sku}
                                </li>
                            ))}
                        </ul>
                    )}
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
