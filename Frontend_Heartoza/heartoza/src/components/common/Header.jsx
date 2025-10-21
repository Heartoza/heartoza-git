import React, { useContext, useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/logo/3.png";
import "../css/Header.css";
import { AuthContext } from "../../context/AuthContext";
import debounce from "lodash.debounce";
import http from "../../services/api";
import { AuthService } from "../../services/authService";

function Header() {
    const { user, logout } = useContext(AuthContext);
    const [searchText, setSearchText] = useState("");
    const [results, setResults] = useState([]);
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState("");

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

    useEffect(() => {
        let mounted = true;
        const fetchMe = async () => {
            try {
                if (!user) { setProfile(null); setAvatarUrl(""); return; }
                const me = await AuthService.getProfile();
                if (!mounted) return;
                setProfile(me);
                setAvatarUrl(me?.avatar?.url || "");
            } catch {
                // im lặng: chỉ fallback chữ cái
                setAvatarUrl("");
            }
        };
        fetchMe();
        return () => { mounted = false; };
    }, [user]);

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
            {/* MAIN HEADER */}
            <header className="mainbar">
                <div className="mainbar__container">
                    {/* logo + brand */}
                    <div className="mainbar__brand" onClick={() => navigate("/")}>
                        <img src={logo} alt="Heartoza" className="brand__logo" />
                        <div className="brand__text">
                            <div className="brand__name">Heartoza</div>
                            <div className="brand__tag">PERSONALIZED GIFT</div>
                        </div>
                    </div>

                    {/* search center */}
                    <div className="mainbar__search">
                        <div className="searchbox">
                            <svg className="searchbox__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm..."
                                value={searchText}
                                onChange={onSearchChange}
                                onKeyDown={onSearchEnter}
                                aria-label="Tìm kiếm sản phẩm"
                                className="searchbox__input"
                            />
                            <button
                                className="searchbox__btn"
                                onClick={() => {
                                    const q = searchText.trim();
                                    if (q) {
                                        navigate(`/products?search=${encodeURIComponent(q)}`);
                                        setSearchText(""); setResults([]);
                                    }
                                }}
                                aria-label="Tìm kiếm"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                                </svg>
                            </button>

                            {results.length > 0 && (
                                <ul className="searchbox__suggest">
                                    {results.map(item => (
                                        <li
                                            key={item.productId}
                                            onClick={() => {
                                                navigate(`/products/${item.productId}`);
                                                setSearchText(""); setResults([]);
                                            }}
                                        >
                                            <span className="suggest__name">{item.name}</span>
                                            {item.sku && <span className="suggest__sku">SKU: {item.sku}</span>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Gợi ý tìm kiếm nhanh */}
                        <div className="search-hotkeys">
                            <NavLink to="/products?search=hộp quà" className="hotkey">Hộp quà</NavLink>
                            <NavLink to="/products?search=thiệp" className="hotkey">Thiệp</NavLink>
                            <NavLink to="/products?search=ribbon" className="hotkey">Ruy băng</NavLink>
                        </div>
                    </div>

                    {/* actions right */}
                    <div className="mainbar__actions">
                        <NavLink to="/cart" className="iconbtn" title="Giỏ hàng">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                            </svg>
                        </NavLink>

                        {!user ? (
                            <div className="auth-mini">
                                <NavLink to="/login" className="auth-mini__link">Đăng nhập</NavLink>
                                <span className="sep">|</span>
                                <NavLink to="/register" className="auth-mini__link">Đăng ký</NavLink>
                            </div>
                        ) : (
                            <div className="account">
                                <NavLink to="/profile" className="account__btn" title="Tài khoản">
                                    <div className="account__avatar" aria-label="Ảnh đại diện">
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt="Ảnh đại diện"
                                                onError={() => setAvatarUrl("")}
                                            />
                                        ) : (
                                            (profile?.fullName || user?.fullName || user?.email || "U")
                                                .toString()
                                                .trim()[0]
                                                ?.toUpperCase() || "U"
                                        )}
                                    </div>
                                    <span className="account__name">
                                        {profile?.fullName || user?.fullName || user?.email}
                                    </span>
                                </NavLink>
                                <button onClick={logout} className="iconbtn iconbtn--ghost" title="Đăng xuất">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* SUBNAV */}
            <nav className="subnav">
                <div className="subnav__container">
                    <NavLink to="/" end className="subnav__link">Trang chủ</NavLink>
                    <NavLink to="/products" className="subnav__link">Sản phẩm</NavLink>
                    <NavLink to="/about" className="subnav__link">Về chúng tôi</NavLink>
                    <NavLink to="/contact" className="subnav__link">Liên hệ</NavLink>
                    {user && <NavLink to="/orders" className="subnav__link">Đơn hàng</NavLink>}
                </div>
            </nav>
        </>
    );
}

export default Header;
