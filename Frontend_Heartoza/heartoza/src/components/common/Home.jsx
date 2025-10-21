import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../css/Home.css";
import api from "../../services/api";
import useSeoMeta from "../../hooks/useSeoMeta";
import BannerStrip from "../../components/marketing/BannerStrip";

export default function Home() {
    const [featured, setFeatured] = useState([]);
    const navigate = useNavigate();
    useSeoMeta("/"); // gắn tiêu đề + og

    const pickImage = (p) => {
        const candidates = [
            p?.thumbnailUrl,
            p?.imageUrl,
            p?.primaryImageUrl,
            p?.primaryImage?.url,
            (Array.isArray(p?.images) && p.images.find((x) => x?.isPrimary)?.url) || null,
            (Array.isArray(p?.images) && p.images[0]?.url) || null,
        ];
        const found = candidates.find((u) => typeof u === "string" && u.trim() !== "");
        return found || "/img/no-image.png";
    };

    const normalize = (p) => ({
        productId: p?.productId ?? p?.id,
        name: p?.name ?? p?.productName ?? "Sản phẩm",
        sku: p?.sku ?? p?.SKU ?? "",
        price: Number(p?.price || 0),
        totalSold: Number(p?.totalSold ?? p?.sold ?? 0),
        img: pickImage(p),
    });

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/products/top-selling?top=5");
                const arr = Array.isArray(res?.data?.items) ? res.data.items : (res?.data || []);
                setFeatured(arr.map(normalize));
            } catch (err) {
                console.error("Lỗi khi fetch featured:", err);
                setFeatured([]);
            }
        })();
    }, []);

    const handleAddToCart = async (productId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Bạn cần đăng nhập trước khi thêm vào giỏ hàng.");
            navigate("/login?reason=add-to-cart");
            return;
        }

        try {
            await api.post("Cart/AddItem", {
                productId,
                quantity: 1,
            });
            alert("🛒 Đã thêm vào giỏ hàng thành công!");
            localStorage.setItem("recentAddedProduct", productId);

            navigate("/cart");
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
            }, 0);

        } catch (error) {
            console.error("Lỗi khi thêm vào giỏ hàng:", error);
            alert("❌ Thêm vào giỏ hàng thất bại.");
        }
    };


    return (
        <div className="home-container">
            <BannerStrip position="home-top" className="mb-4" />
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Quà Tặng Ý Nghĩa<br />Cho Mọi Dịp Đặc Biệt</h1>
                    <p className="hero-subtitle">
                        Khám phá bộ sưu tập quà tặng độc đáo được chọn lọc kỹ lưỡng<br />
                        Tạo nên những khoảnh khắc đáng nhớ cho người thân yêu
                    </p>
                    <div className="hero-actions">
                        <Link to="/products" className="btn-primary">
                            <span>Khám phá ngay</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Link>
                        <Link to="/about" className="btn-secondary">Về chúng tôi</Link>
                    </div>
                </div>
                <div className="hero-decoration">
                    <div className="decoration-circle circle-1"></div>
                    <div className="decoration-circle circle-2"></div>
                    <div className="decoration-circle circle-3"></div>
                </div>
            </section>
            <BannerStrip position="home-mid" className="my-6" />
            {/* Stats Section */}
            <section className="stats-section">
                <div className="stat-item">
                    <div className="stat-number">5000+</div>
                    <div className="stat-label">Sản phẩm</div>
                </div>
                <div className="stat-item">
                    <div className="stat-number">10000+</div>
                    <div className="stat-label">Khách hàng</div>
                </div>
                <div className="stat-item">
                    <div className="stat-number">98%</div>
                    <div className="stat-label">Hài lòng</div>
                </div>
                <div className="stat-item">
                    <div className="stat-number">24/7</div>
                    <div className="stat-label">Hỗ trợ</div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="featured-section">
                <div className="section-header">
                    <h2>Sản Phẩm Nổi Bật</h2>
                    <p>Những món quà được yêu thích nhất</p>
                </div>

                <div className="products-grid">
                    {featured.length > 0 ? featured.map((item) => (
                        <div key={item.productId} className="product-card">
                            <div className="product-image" onClick={() => navigate(`/products/${item.productId}`)}>
                                <img src={item.img} alt={item.name} />
                                <div className="product-overlay">
                                    <button
                                        className="add-to-cart-card-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddToCart(item.productId);
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="9" cy="21" r="1" />
                                            <circle cx="20" cy="21" r="1" />
                                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                        </svg>
                                        Thêm vào giỏ
                                    </button>
                                </div>

                                {item.totalSold > 100 && (
                                    <span className="product-badge">🔥 Bán chạy</span>
                                )}
                            </div>
                            <div className="product-info">
                                <h3 className="product-name" onClick={() => navigate(`/products/${item.productId}`)}>
                                    {item.name}
                                </h3>
                                <div className="product-meta">
                                    <span className="product-price">
                                        {Number(item.price || 0).toLocaleString("vi-VN")}₫
                                    </span>
                                    <span className="product-sold">Đã bán {item.totalSold}</span>
                                </div>
                                <button
                                    className="add-to-cart-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddToCart(item.productId);
                                    }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="9" cy="21" r="1" />
                                        <circle cx="20" cy="21" r="1" />
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                    </svg>
                                    <span>Thêm vào giỏ</span>
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Đang tải sản phẩm...</p>
                        </div>
                    )}
                </div>

                <div className="section-footer">
                    <Link to="/products" className="view-all-btn">
                        Xem tất cả sản phẩm
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </Link>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="feature-card">
                    <div className="feature-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    <h3>Miễn Phí Vận Chuyển</h3>
                    <p>Giao hàng miễn phí cho đơn từ 500.000₫</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                        </svg>
                    </div>
                    <h3>Giao Hàng Nhanh</h3>
                    <p>Giao hàng trong vòng 2-3 ngày làm việc</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    </div>
                    <h3>Đảm Bảo Chất Lượng</h3>
                    <p>Cam kết 100% sản phẩm chính hãng</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                    <h3>Hỗ Trợ 24/7</h3>
                    <p>Đội ngũ tư vấn nhiệt tình, chuyên nghiệp</p>
                </div>
            </section>
        </div>
    );
}
