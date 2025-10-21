import React, { useContext, useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/logo/3.png";
import "../css/Header.css";
import { AuthContext } from "../../context/AuthContext";
import debounce from "lodash.debounce";
import http from "../../services/api";

function Header() {
    const { user, logout } = useContext(AuthContext);
    const [searchText, setSearchText] = useState("");
    const [results, setResults] = useState([]);
    const navigate = useNavigate();

    // Debounced search
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
                setResults([]);
            }
        }, 500),
        []
    );

    useEffect(() => {
        handleSearch(searchText);
        return () => handleSearch.cancel();
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
                <div className="header-container">
                    <div className="header-left" onClick={() => navigate("/")}>
                        <div className="logo-wrapper">
                            <img src={logo} alt="Heartoza" className="logo" />
                        </div>
                        <div className="brand-info">
                            <h1 className="site-name">Heartoza</h1>
                            <p className="brand-tagline">Personalized Gift</p>
                        </div>
                    </div>

                    <div className="header-search">
                        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                        </svg>
                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            value={searchText}
                            onChange={onSearchChange}
                            onKeyDown={onSearchEnter}
                            aria-label="Tìm kiếm sản phẩm"
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
                                        <span className="suggestion-name">{item.name}</span>
                                        {item.sku && <span className="suggestion-sku">SKU: {item.sku}</span>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="header-actions">
                        <NavLink to="/cart" className="action-btn cart-btn" title="Giỏ hàng">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="9" cy="21" r="1"/>
                                <circle cx="20" cy="21" r="1"/>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                            </svg>
                        </NavLink>
                        
                        {!user ? (
                            <div className="auth-buttons">
                                <NavLink to="/login" className="btn-login">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                        <polyline points="10 17 15 12 10 7"/>
                                        <line x1="15" y1="12" x2="3" y2="12"/>
                                    </svg>
                                    Đăng nhập
                                </NavLink>
                                <NavLink to="/register" className="btn-register">
                                    Đăng ký
                                </NavLink>
                            </div>
                        ) : (
                            <div className="user-section">
                                <NavLink to="/profile" className="user-profile">
                                    <div className="avatar">
                                        {user.fullName ? user.fullName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : "U")}
                                    </div>
                                    <div className="user-details">
                                        <span className="user-name">{user.fullName || user.email}</span>
                                        <span className="user-role">Khách hàng</span>
                                    </div>
                                </NavLink>
                                <button onClick={logout} className="btn-logout" title="Đăng xuất">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                        <polyline points="16 17 21 12 16 7"/>
                                        <line x1="21" y1="12" x2="9" y2="12"/>
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <nav className="navbar">
                <div className="navbar-container">
                    <NavLink to="/" end className="nav-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                        Trang chủ
                    </NavLink>
                    <NavLink to="/products" className="nav-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                        </svg>
                        Sản phẩm
                    </NavLink>
                    <NavLink to="/about" className="nav-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="16" x2="12" y2="12"/>
                            <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        Về chúng tôi
                    </NavLink>
                    <NavLink to="/contact" className="nav-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        Liên hệ
                    </NavLink>
                    {user && (
                        <NavLink to="/orders" className="nav-link">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                                <line x1="3" y1="6" x2="21" y2="6"/>
                                <path d="M16 10a4 4 0 0 1-8 0"/>
                            </svg>
                            Đơn hàng
                        </NavLink>
                    )}
                </div>
            </nav>
        </>
    );
}

export default Header;
