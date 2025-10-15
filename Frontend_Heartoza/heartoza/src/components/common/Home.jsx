// src/components/customer/Home.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/Home.css";
import api from "../../services/api";

export default function Home() {
    const [featured, setFeatured] = useState([]);

    // chuẩn hoá product
    const normalize = (p) => ({
        productId: p?.productId ?? p?.id,
        name: p?.name ?? p?.productName ?? "Sản phẩm",
        sku: p?.sku ?? p?.SKU ?? "",
        price: Number(p?.price || 0),
        totalSold: Number(p?.totalSold ?? p?.sold ?? 0),
        thumbnailUrl: p?.thumbnailUrl,
        imageUrl: p?.imageUrl,
    });

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/products/top-selling");
                const arr = Array.isArray(res?.data?.items) ? res.data.items : (res?.data || []);
                const normalized = arr.map(normalize);

                const top3 = normalized
                    .sort((a, b) => b.totalSold - a.totalSold)
                    .slice(0, 3);

                setFeatured(top3);
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
                <p>
                    Kho quà tặng đặc biệt cho mọi dịp — Sinh nhật, Lễ tết, và nhiều hơn!
                </p>
                <Link to="/products" className="cta-btn">
                    Khám phá ngay
                </Link>
            </section>

            {/* Giới thiệu ngắn */}
            <section className="home-about">
                <h2>Tại sao chọn Heartoza?</h2>
                <p>
                    Chúng tôi cung cấp những món quà chất lượng, giao hàng nhanh chóng,
                    dịch vụ chăm sóc khách hàng tận tâm. Heartoza giúp bạn biến mỗi dịp
                    đặc biệt thành một kỷ niệm đáng nhớ ❤️.
                </p>
            </section>

            {/* Sản phẩm nổi bật */}
            <section className="home-featured">
                <h2>✨ Sản phẩm nổi bật ✨</h2>
                <div className="featured-grid">
                    {featured.length > 0 ? (
                        featured.map((item) => (
                            <div key={item.productId} className="featured-card">
                                <div className="card-img">
                                    <img
                                        src={
                                            (item.thumbnailUrl && item.thumbnailUrl.trim() !== "")
                                                ? item.thumbnailUrl
                                                : (item.imageUrl && item.imageUrl.trim() !== "")
                                                    ? item.imageUrl
                                                    : "/img/no-image.png"
                                        }
                                        alt={item.name}
                                    />
                                </div>
                                <div className="card-info">
                                    <h3>{item.name}</h3>
                                    {item.sku && <p>SKU: {item.sku}</p>}
                                    <span className="price">
                                        {Number(item.price || 0).toLocaleString("vi-VN")}₫
                                    </span>
                                    <p>Đã bán: {item.totalSold}</p>
                                    <Link
                                        to={`/products/${item.productId}`}
                                        className="detail-link"
                                    >
                                        Xem chi tiết
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Đang tải sản phẩm...</p>
                    )}
                </div>

                <Link to="/products" className="view-more">
                    Xem tất cả sản phẩm →
                </Link>
            </section>
        </div>
    );
}