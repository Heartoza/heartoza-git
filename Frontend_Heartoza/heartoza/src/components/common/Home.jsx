import React from "react";
import { Link } from "react-router-dom";
import "../css/Home.css";

export default function Home() {
  return (
    <div className="home-container">
      {/* Banner */}
      <section className="home-banner">
        <h1>🎁 Chào mừng đến với Heartoza 🎁</h1>
        <p>Kho quà tặng đặc biệt cho mọi dịp — Sinh nhật, Lễ tết, và nhiều hơn!</p>
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
        <h2>Sản phẩm nổi bật</h2>
        <div className="featured-grid">
          <div className="featured-card">
            <img src="https://picsum.photos/300/200?random=1" alt="Gift 1" />
            <p>Hộp quà sinh nhật</p>
          </div>
          <div className="featured-card">
            <img src="https://picsum.photos/300/200?random=2" alt="Gift 2" />
            <p>Combo quà Valentine</p>
          </div>
          <div className="featured-card">
            <img src="https://picsum.photos/300/200?random=3" alt="Gift 3" />
            <p>Gấu bông dễ thương</p>
          </div>
        </div>
        <Link to="/products" className="view-more">
          Xem tất cả sản phẩm →
        </Link>
      </section>
    </div>
  );
}
