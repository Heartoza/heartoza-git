import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "../css/ProductDetail.css";
import http from "../../services/api";

export default function ProductDetail() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [mainImg, setMainImg] = useState("");
    const [loading, setLoading] = useState(true);
    const [relatedProducts, setRelatedProducts] = useState([]);
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

                    // Load related products by category
                    if (p?.categoryId) {
                        try {
                            const relatedRes = await http.get("Products", {
                                params: {
                                    isActive: true,
                                    categoryId: p.categoryId
                                },
                                validateStatus: (s) => (s >= 200 && s < 300) || s === 204,
                            });
                            const allProducts = relatedRes.status === 204 ? [] : (relatedRes.data?.items || []);
                            // Filter out current product and take first 4
                            const filtered = allProducts.filter(item => item.productId !== p.productId).slice(0, 4);
                            setRelatedProducts(filtered);
                        } catch (err) {
                            console.log("Lỗi load sản phẩm tương tự:", err);
                        }
                    }
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

    if (loading) {
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <p style={{ color: '#999', fontSize: '1rem' }}>Đang tải...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <p style={{ color: '#999', fontSize: '1rem' }}>😔 Không tìm thấy sản phẩm</p>
            </div>
        );
    }

    const outOfStock = Number(product.onHand || 0) <= 0;
    const inactive = !product.isActive;
    const disableAdd = outOfStock || inactive;

    const fallback = "/img/no-image.png";
    const mainSrc = mainImg && mainImg.trim() !== "" ? mainImg : fallback;

    return (
        <div className="product-detail-page">
            <div className="product-detail-container">
                {/* Back Button */}
                <Link to="/products" className="back-button">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Quay lại danh sách
                </Link>

                {/* Main Product Card */}
                <div className="product-main-card">
                    {/* Left: Images */}
                    <div className="product-images-section">
                        {/* Main Image */}
                        <div className="main-image-wrapper">
                            <img 
                                src={mainSrc} 
                                alt={product.name}
                                className="main-image"
                            />
                        </div>

                        {/* Thumbnails */}
                        {product.images?.length > 1 && (
                            <div className="thumbnails-wrapper">
                                {product.images.map((im) => (
                                    <button
                                        key={im.productMediaId || im.mediaId}
                                        onClick={() => setMainImg(im.url)}
                                        className={`thumbnail-btn ${im.url === mainImg ? 'active' : ''}`}
                                    >
                                        <img 
                                            src={im.url} 
                                            alt=""
                                            className="thumbnail-image"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Info */}
                    <div className="product-info-section">
                        <h1 className="product-title">{product.name}</h1>

                        <div className="product-meta">
                            <div className="meta-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 7h-9M14 17H5M6 11l-3-3m0 0l3-3m-3 3h14"/>
                                </svg>
                                <span>SKU: {product.sku}</span>
                            </div>
                            <div className="meta-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                                </svg>
                                <span>{product.categoryName}</span>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="price-section">
                            <span className="price-label">Giá bán</span>
                            <p className="product-price">
                                {Number(product.price || 0).toLocaleString("vi-VN")} đ
                            </p>
                        </div>

                        {/* Stock */}
                        <div className="stock-section">
                            <div className="stock-info">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                                </svg>
                                <div>
                                    <span className="stock-label">Tồn kho</span>
                                    <p className={`stock-value ${outOfStock ? 'out-of-stock' : 'in-stock'}`}>
                                        {product.onHand} sản phẩm
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Add to Cart */}
                        <button
                            onClick={handleAddToCart}
                            disabled={disableAdd}
                            className={`add-to-cart-btn ${disableAdd ? 'disabled' : ''}`}
                            title={
                                disableAdd
                                    ? inactive
                                        ? "Sản phẩm ngừng bán"
                                        : "Sản phẩm đã hết hàng"
                                    : "Thêm vào giỏ hàng"
                            }
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="9" cy="21" r="1"/>
                                <circle cx="20" cy="21" r="1"/>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                            </svg>
                            {disableAdd ? 'Không thể thêm vào giỏ' : 'Thêm vào giỏ hàng'}
                        </button>

                        {disableAdd && (
                            <div className="warning-message">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                    <line x1="12" y1="9" x2="12" y2="13"/>
                                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                                </svg>
                                {inactive ? 'Sản phẩm ngừng bán' : 'Sản phẩm đã hết hàng'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                    <div className="related-products-section">
                        <h2 className="related-title">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="9" cy="21" r="1"/>
                                <circle cx="20" cy="21" r="1"/>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                            </svg>
                            Sản phẩm tương tự
                        </h2>

                        <div className="related-products-grid">
                            {relatedProducts.map((p) => (
                                <div
                                    key={p.productId}
                                    onClick={() => navigate(`/products/${p.productId}`)}
                                    className="related-product-card"
                                >
                                    <div className="related-product-image">
                                        <img
                                            src={
                                                (p.thumbnailUrl && p.thumbnailUrl.trim() !== "")
                                                    ? p.thumbnailUrl
                                                    : (p.imageUrl && p.imageUrl.trim() !== "")
                                                        ? p.imageUrl
                                                        : "/img/no-image.png"
                                            }
                                            alt={p.name}
                                        />
                                    </div>

                                    <div className="related-product-info">
                                        <h3 className="related-product-name">{p.name}</h3>
                                        <p className="related-product-price">
                                            {Number(p.price || 0).toLocaleString("vi-VN")} đ
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
