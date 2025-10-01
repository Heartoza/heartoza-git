import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/Home.css";

export default function Home() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    fetch("https://localhost:7109/api/products/top-selling")
      .then((res) => res.json())
      .then((data) => {
        // sort giảm dần theo totalSold rồi lấy top 3
        const top3 = data
          .sort((a, b) => b.totalSold - a.totalSold)
          .slice(0, 3);
        setFeatured(top3);
      })
      .catch((err) => console.error("Lỗi khi fetch featured:", err));
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
                    src={item.imageUrl || "/default-product.jpg"}
                    alt={item.name}
                  />
                </div>
                <div className="card-info">
                  <h3>{item.name}</h3>
                  <p>SKU: {item.sku}</p>
                  <span className="price">
                    {item.price.toLocaleString()}₫
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
