import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "../css/ProductDetail.css";
import http from "../../services/api";

export default function ProductDetail() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [mainImg, setMainImg] = useState("");
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
                    setMainImg("");
                } else {
                    const p = res.data || null;
                    setProduct(p);
                    // ưu tiên ảnh chính, sau đó ảnh đầu tiên, cuối cùng là placeholder
                    const url =
                        p?.primaryImageUrl?.trim() ||
                        (p?.images?.length ? p.images[0].url : "") ||
                        "";
                    setMainImg(url);
                }
            } catch (err) {
                console.error("Lỗi khi load chi tiết sản phẩm:", err);
                setProduct(null);
                setMainImg("");
            } finally {
                setLoading(false);
            }
        };
        if (id) load();
    }, [id]);

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

    const fallback = "/img/no-image.png";
    const mainSrc = mainImg && mainImg.trim() !== "" ? mainImg : fallback;

    return (
        <div className="product-detail-container">
            <div className="detail-card">
                {/* Cột trái: Hình ảnh */}
                <div className="detail-image">
                    <img src={mainSrc} alt={product.name} />
                    {/* thumbnails nếu có nhiều ảnh */}
                    {product.images?.length > 1 && (
                        <div className="thumb-row">
                            {product.images.map((im) => (
                                <button
                                    key={im.productMediaId || im.mediaId}
                                    className={`thumb ${im.url === mainImg ? "active" : ""}`}
                                    onClick={() => setMainImg(im.url)}
                                >
                                    <img src={im.url} alt="" />
                                </button>
                            ))}
                        </div>
                    )}
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
