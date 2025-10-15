// src/components/customer/Home.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/Home.css";
import api from "../../services/api";

export default function Home() {
    const [featured, setFeatured] = useState([]);

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
                // 👉 Lấy 5 sp top-selling
                const res = await api.get("/products/top-selling?top=5");
                const arr = Array.isArray(res?.data?.items) ? res.data.items : (res?.data || []);
                // ❌ không slice top3 nữa
                setFeatured(arr.map(normalize));
            } catch (err) {
                console.error("Lỗi khi fetch featured:", err);
                setFeatured([]);
            }
        })();
    }, []);

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
                        <div key={item.productId} className="featured-card">
                            <div className="card-img">
                                <img src={item.img} alt={item.name} />
                            </div>
                            <div className="card-info">
                                <h3>{item.name}</h3>
                                {item.sku && <p>SKU: {item.sku}</p>}
                                <span className="price">{Number(item.price || 0).toLocaleString("vi-VN")}₫</span>
                                <p>Đã bán: {item.totalSold}</p>
                                <Link to={`/products/${item.productId}`} className="detail-link">Xem chi tiết</Link>
                            </div>
                        </div>
                    )) : <p>Đang tải sản phẩm...</p>}
                </div>

                <Link to="/products" className="view-more">Xem tất cả sản phẩm →</Link>
            </section>
        </div>
    );
}
