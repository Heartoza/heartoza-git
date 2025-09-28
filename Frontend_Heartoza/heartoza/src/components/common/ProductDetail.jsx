import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/ProductDetail.css";

export default function ProductDetail() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        axios
            .get(`https://localhost:7109/api/Products/${id}?includeInactive=false`)
            .then((res) => setProduct(res.data))
            .catch((err) => console.error("Lỗi khi load chi tiết sản phẩm:", err))
            .finally(() => setLoading(false));
    }, [id]);

    // 🟢 Hàm thêm vào giỏ hàng
    const handleAddToCart = async () => {
        try {
            const token = localStorage.getItem("token"); // 👉 lấy JWT từ localStorage sau khi login
            if (!token) {
                alert("Bạn cần đăng nhập trước khi thêm vào giỏ hàng.");
                navigate("/login");
                return;
            }

            await axios.post(
                "https://localhost:7109/api/Cart/AddItem",
                {
                    productId: product.productId,
                    quantity: 1, // mặc định thêm 1 sản phẩm
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            alert("Đã thêm vào giỏ hàng thành công!");
            navigate("/cart"); // 👉 sau khi thêm xong chuyển sang trang giỏ hàng
        } catch (error) {
            console.error("Lỗi khi thêm vào giỏ hàng:", error);
            alert("Thêm vào giỏ hàng thất bại.");
        }
    };

    if (loading) return <p>Đang tải...</p>;
    if (!product) return <p>Không tìm thấy sản phẩm</p>;

    return (
        <div className="product-detail-container">
            <div className="detail-card">
                {/* Cột trái: Hình ảnh */}
                <div className="detail-image">
                    <img
                        src={
                            "https://dimensions.edu.vn/public/upload/2025/01/avatar-con-gai-cute-2.webp"
                        }
                        alt={product.name}
                    />
                </div>

                {/* Cột phải: Thông tin */}
                <div className="detail-info">
                    <h2 className="detail-title">{product.name}</h2>
                    <p className="detail-sku">SKU: {product.sku}</p>
                    <p className="detail-category">Danh mục: {product.categoryName}</p>
                    <p className="detail-price">
                        <span className="price-number">{product.price.toLocaleString()}</span> <span className="currency">đ</span>
                    </p>
                    <p>
                        <strong>Tồn kho:</strong> {product.onHand}
                    </p>
                    <p>
                        <strong>Trạng thái:</strong>{" "}
                        <span className={product.isActive ? "active" : "inactive"}>
                            {product.isActive ? "Đang bán" : "Ngừng bán"}
                        </span>
                    </p>
                    <p>
                        <strong>Ngày tạo:</strong>{" "}
                        {new Date(product.createdAt).toLocaleDateString("vi-VN")}
                    </p>

                    <div className="detail-actions">
                        <Link to="/products" className="btn-back">
                            ⬅ Quay lại
                        </Link>
                        {/* 🟢 Gọi hàm khi click */}
                        <button className="btn-add-cart" onClick={handleAddToCart}>
                            Thêm vào giỏ hàng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


