import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "../css/ProductDetail.css"; // bạn có thể tạo CSS riêng

export default function ProductDetail() {
  const { id } = useParams(); // lấy id từ URL
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`https://localhost:7109/api/Products/${id}`)
      .then((res) => {
        console.log("Chi tiết sản phẩm:", res.data);
        setProduct(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi lấy chi tiết sản phẩm:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p>Đang tải...</p>;
  if (!product) return <p>Không tìm thấy sản phẩm</p>;

  return (
    <div className="product-detail">
      <div className="detail-card">
        <img
          src={product.imageUrl || "/img/no-image.png"}
          alt={product.name}
          className="detail-img"
        />
        <div className="detail-info">
          <h2>{product.name}</h2>
          <p className="price">{product.price?.toLocaleString()} đ</p>
          <p><strong>SKU:</strong> {product.sku}</p>
          <p><strong>Mô tả:</strong> {product.description || "Chưa có mô tả"}</p>
          
          <div className="actions">
            <Link to="/" className="btn-back">← Quay lại danh sách</Link>
            <button className="btn-buy">Thêm vào giỏ hàng</button>
          </div>
        </div>
      </div>
    </div>
  );
}
