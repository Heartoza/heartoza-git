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
        <div style={{
            background: '#f8f9fa',
            minHeight: '100vh',
            padding: '30px 20px'
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {/* Back Button */}
                <Link to="/products" style={{
                    display: 'inline-block',
                    marginBottom: '20px',
                    padding: '8px 16px',
                    background: 'white',
                    border: '2px solid #6db4f7',
                    borderRadius: '8px',
                    color: '#6db4f7',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#6db4f7';
                    e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#6db4f7';
                }}>
                    ⬅ Quay lại
                </Link>

                {/* Main Product Card */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '30px',
                    background: 'white',
                    borderRadius: '12px',
                    padding: '25px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    marginBottom: '40px'
                }}>
                    {/* Left: Images */}
                    <div>
                        {/* Main Image */}
                        <div style={{
                            width: '100%',
                            height: '400px',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            background: '#f5f5f5',
                            marginBottom: '12px'
                        }}>
                            <img 
                                src={mainSrc} 
                                alt={product.name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        </div>

                        {/* Thumbnails */}
                        {product.images?.length > 1 && (
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                flexWrap: 'wrap'
                            }}>
                                {product.images.map((im) => (
                                    <button
                                        key={im.productMediaId || im.mediaId}
                                        onClick={() => setMainImg(im.url)}
                                        style={{
                                            width: '70px',
                                            height: '70px',
                                            borderRadius: '6px',
                                            overflow: 'hidden',
                                            border: im.url === mainImg ? '2px solid #6db4f7' : '2px solid #ddd',
                                            cursor: 'pointer',
                                            background: '#f5f5f5',
                                            padding: '0',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (im.url !== mainImg) {
                                                e.currentTarget.style.borderColor = '#6db4f7';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (im.url !== mainImg) {
                                                e.currentTarget.style.borderColor = '#ddd';
                                            }
                                        }}
                                    >
                                        <img 
                                            src={im.url} 
                                            alt=""
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <h1 style={{
                            fontSize: '1.6rem',
                            fontWeight: '700',
                            color: '#333',
                            margin: '0',
                            lineHeight: '1.3'
                        }}>
                            {product.name}
                        </h1>

                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            fontSize: '0.85rem',
                            color: '#666',
                            paddingBottom: '15px',
                            borderBottom: '1px solid #e0e0e0'
                        }}>
                            <span><strong>SKU:</strong> {product.sku}</span>
                            <span>•</span>
                            <span><strong>Danh mục:</strong> {product.categoryName}</span>
                        </div>

                        {/* Price */}
                        <div style={{
                            background: 'linear-gradient(135deg, #6db4f7 0%, #4a9fe8 100%)',
                            padding: '20px',
                            borderRadius: '10px'
                        }}>
                            <p style={{
                                fontSize: '2rem',
                                fontWeight: '700',
                                color: 'white',
                                margin: '0',
                                textAlign: 'center'
                            }}>
                                {Number(product.price || 0).toLocaleString("vi-VN")} đ
                            </p>
                        </div>

                        {/* Stock */}
                        <div style={{
                            padding: '12px',
                            background: '#f8f9fa',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <p style={{
                                fontSize: '0.8rem',
                                color: '#999',
                                margin: '0 0 5px 0'
                            }}>
                                Tồn kho
                            </p>
                            <p style={{
                                fontSize: '1.2rem',
                                fontWeight: '600',
                                color: outOfStock ? '#f44336' : '#4caf50',
                                margin: '0'
                            }}>
                                {product.onHand}
                            </p>
                        </div>

                        {/* Add to Cart */}
                        <button
                            onClick={handleAddToCart}
                            disabled={disableAdd}
                            style={{
                                width: '100%',
                                padding: '14px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: disableAdd ? '#999' : 'white',
                                background: disableAdd ? '#e0e0e0' : 'linear-gradient(135deg, #6db4f7 0%, #4a9fe8 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: disableAdd ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (!disableAdd) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(109, 180, 247, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!disableAdd) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }
                            }}
                            title={
                                disableAdd
                                    ? inactive
                                        ? "Sản phẩm ngừng bán"
                                        : "Sản phẩm đã hết hàng"
                                    : "Thêm vào giỏ hàng"
                            }
                        >
                            {disableAdd ? '❌ Không thể thêm' : '🛒 Thêm vào giỏ hàng'}
                        </button>

                        {disableAdd && (
                            <p style={{
                                fontSize: '0.85rem',
                                color: '#f44336',
                                textAlign: 'center',
                                margin: '0'
                            }}>
                                {inactive ? '⚠️ Sản phẩm ngừng bán' : '⚠️ Sản phẩm đã hết hàng'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                    <div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            🎁 Sản phẩm tương tự
                        </h2>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '20px'
                        }}>
                            {relatedProducts.map((p) => (
                                <div
                                    key={p.productId}
                                    onClick={() => navigate(`/products/${p.productId}`)}
                                    style={{
                                        background: 'white',
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        border: '2px solid transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-5px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(109, 180, 247, 0.3)';
                                        e.currentTarget.style.borderColor = '#6db4f7';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
                                        e.currentTarget.style.borderColor = 'transparent';
                                    }}
                                >
                                    {/* Image */}
                                    <div style={{
                                        width: '100%',
                                        height: '200px',
                                        overflow: 'hidden',
                                        background: '#f0f0f0'
                                    }}>
                                        <img
                                            src={
                                                (p.thumbnailUrl && p.thumbnailUrl.trim() !== "")
                                                    ? p.thumbnailUrl
                                                    : (p.imageUrl && p.imageUrl.trim() !== "")
                                                        ? p.imageUrl
                                                        : "/img/no-image.png"
                                            }
                                            alt={p.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        />
                                    </div>

                                    {/* Info */}
                                    <div style={{ padding: '15px' }}>
                                        <h3 style={{
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            color: '#333',
                                            marginBottom: '8px',
                                            minHeight: '40px',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {p.name}
                                        </h3>
                                        <p style={{
                                            fontSize: '1.1rem',
                                            fontWeight: '700',
                                            color: '#6db4f7',
                                            margin: '0'
                                        }}>
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
