import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../css/Home.css";
import api from "../../services/api";

export default function Home() {
    const [featured, setFeatured] = useState([]);
    const navigate = useNavigate();

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
            {/* Banner */}
            <section className="home-banner">
                <h1>🎁 Chào mừng đến với Heartoza 🎁</h1>
                <p>Kho quà tặng đặc biệt cho mọi dịp — Sinh nhật, Lễ tết, và nhiều hơn!</p>
                <Link to="/products" className="cta-btn">Khám phá ngay</Link>
            </section>

            {/* Featured */}
            <section className="home-featured">
                <h2>✨ Sản phẩm nổi bật ✨</h2>
                <div className="featured-grid">
                    {featured.length ? featured.map((item) => (
                        <div
                            key={item.productId}
                            className="featured-card"
                            onClick={() => navigate(`/products/${item.productId}`)} // 👉 Nhấn vào card là đi đến trang chi tiết
                            style={{ cursor: "pointer" }}
                        >
                            <div className="card-img">
                                <img src={item.img} alt={item.name} />
                            </div>
                            <div className="card-info">
                                <h3>{item.name}</h3>
                                {item.sku && <p>SKU: {item.sku}</p>}
                                <span className="price">{Number(item.price || 0).toLocaleString("vi-VN")}₫</span>
                                <p>Đã bán: {item.totalSold}</p>

                                <div className="card-actions">
                                    {/* 🛒 Thêm vào giỏ */}
                                    <button
                                        className="cart-btn"
                                        onClick={(e) => {
                                            e.stopPropagation(); // ❗ Ngăn không cho click card mở trang chi tiết khi bấm nút
                                            handleAddToCart(item.productId);
                                        }}
                                        title="Đặt hàng ngay"
                                    >
                                        Đặt hàng
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : <p>Đang tải sản phẩm...</p>}
                </div>

                <Link to="/products" className="view-more">Xem tất cả sản phẩm →</Link>
            </section>
        </div>
    );
}
