import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "../css/ProductDetail.css";
import http from "../../services/api"; // ✅ dùng client chung

export default function ProductDetail() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const res = await http.get(`Products/${id}`, {
                    params: { includeInactive: false },
                    validateStatus: (s) => (s >= 200 && s < 300) || s === 204,
                });
                if (res.status === 204) {
                    setProduct(null);
                } else {
                    setProduct(res.data);
                }
            } catch (err) {
                console.error("Lỗi khi load chi tiết sản phẩm:", err);
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };
        if (id) load();
    }, [id]);

    // 🟢 Thêm vào giỏ hàng
    const handleAddToCart = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Bạn cần đăng nhập trước khi thêm vào giỏ hàng.");
            navigate("/login?reason=add-to-cart");
            return;
        }
        try {
            await http.post("Cart/AddItem", {
                productId: product.productId,
                quantity: 1,
            });
            alert("Đã thêm vào giỏ hàng thành công!");
            navigate("/cart");
        } catch (error) {
            console.error("Lỗi khi thêm vào giỏ hàng:", error);
            alert("Thêm vào giỏ hàng thất bại.");
        }
    };

    if (loading) return <p>Đang tải...</p>;
    if (!product) return <p>Không tìm thấy sản phẩm</p>;

    const outOfStock = Number(product.onHand || 0) <= 0;
    const inactive = !product.isActive;
    const disableAdd = outOfStock || inactive;

    return (
        <div className="product-detail-container">
            <div className="detail-card">
                {/* Cột trái: Hình ảnh */}
                <div className="detail-image">
                    <img
                        src={product.imageUrl && product.imageUrl.trim() !== ""
                            ? product.imageUrl
                            : "/img/no-image.png"}
                        alt={product.name}
                    />
                </div>

                {/* Cột phải: Thông tin */}
                <div className="detail-info">
                    <h2 className="detail-title">{product.name}</h2>
                    <p className="detail-sku">SKU: {product.sku}</p>
                    <p className="detail-category">Danh mục: {product.categoryName}</p>
                    <p className="detail-price">
                        <span className="price-number">
                            {Number(product.price || 0).toLocaleString("vi-VN")}
                        </span>{" "}
                        <span className="currency">đ</span>
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
                        {product.createdAt
                            ? new Date(product.createdAt).toLocaleDateString("vi-VN")
                            : "--"}
                    </p>

                    <div className="detail-actions">
                        <Link to="/products" className="btn-back">
                            ⬅ Quay lại
                        </Link>
                        <button
                            className="btn-add-cart"
                            onClick={handleAddToCart}
                            disabled={disableAdd}
                            title={
                                disableAdd
                                    ? inactive
                                        ? "Sản phẩm ngừng bán"
                                        : "Sản phẩm đã hết hàng"
                                    : "Thêm vào giỏ hàng"
                            }
                        >
                            {disableAdd ? "Không thể thêm" : "Thêm vào giỏ hàng"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
