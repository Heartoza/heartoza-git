import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../css/ProductList.css";
import http from "../../services/api"; // ✅ client có baseURL + token + refresh 401

export default function ProductList() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [priceFilter, setPriceFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [categories, setCategories] = useState([]);

    const searchText = searchParams.get("search") || "";

    // 🔹 Lấy category
    useEffect(() => {
        const loadCats = async () => {
            try {
                const res = await http.get("Categories", {
                    params: { tree: false },
                    validateStatus: (s) => (s >= 200 && s < 300) || s === 204,
                });
                setCategories(res.status === 204 ? [] : res.data || []);
            } catch (err) {
                console.log("Lỗi load categories:", err?.message || err);
            }
        };
        loadCats();
    }, []);

    // 🔹 Lấy sản phẩm theo category / search
    const fetchProducts = async (categoryId = "", search = "") => {
        try {
            const res = await http.get("Products", {
                params: {
                    isActive: true,
                    ...(categoryId && { categoryId }),
                    ...(search && { q: search }),
                },
                validateStatus: (s) => (s >= 200 && s < 300) || s === 204,
            });

            const dataArray = res.status === 204 ? [] : (res.data?.items || []);
            setProducts(dataArray);
            applyFilters(priceFilter, dataArray);
        } catch (err) {
            console.log("Lỗi load products:", err?.message || err);
            setProducts([]);
            setFilteredProducts([]);
        }
    };

    // 🔹 Reload khi category/search đổi
    useEffect(() => {
        fetchProducts(categoryFilter, searchText);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryFilter, searchText]);

    const handlePriceFilter = (e) => {
        const value = e.target.value;
        setPriceFilter(value);
        applyFilters(value, products);
    };

    const handleCategoryFilter = (e) => {
        const value = e.target.value;
        setCategoryFilter(value);
    };

    const applyFilters = (priceValue, list) => {
        let result = [...list];
        if (priceValue === "increament") result.sort((a, b) => a.price - b.price);
        else if (priceValue === "decreament") result.sort((a, b) => b.price - a.price);
        setFilteredProducts(result);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8f9fa',
            padding: '30px 20px'
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                {searchText && (
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '30px',
                        padding: '20px',
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                    }}>
                        <h2 style={{
                            fontSize: '1.5rem',
                            color: '#6db4f7',
                            margin: '0'
                        }}>
                            🔍 Kết quả tìm kiếm cho: "{searchText}"
                        </h2>
                    </div>
                )}

                {/* Filter Section */}
                <div style={{
                    display: 'flex',
                    gap: '15px',
                    marginBottom: '30px',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        position: 'relative',
                        minWidth: '250px'
                    }}>
                        <select
                            value={categoryFilter}
                            onChange={handleCategoryFilter}
                            style={{
                                width: '100%',
                                padding: '12px 40px 12px 15px',
                                fontSize: '1rem',
                                border: '2px solid #e0e0e0',
                                borderRadius: '8px',
                                background: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#6db4f7'}
                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        >
                            <option value="">🏷️ Tất cả danh mục</option>
                            {categories.map((cat) => (
                                <option key={cat.categoryId} value={cat.categoryId}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{
                        position: 'relative',
                        minWidth: '250px'
                    }}>
                        <select
                            value={priceFilter}
                            onChange={handlePriceFilter}
                            style={{
                                width: '100%',
                                padding: '12px 40px 12px 15px',
                                fontSize: '1rem',
                                border: '2px solid #e0e0e0',
                                borderRadius: '8px',
                                background: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#6db4f7'}
                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        >
                            <option value="">💰 Sắp xếp theo giá</option>
                            <option value="increament">Giá: Thấp → Cao</option>
                            <option value="decreament">Giá: Cao → Thấp</option>
                        </select>
                    </div>
                </div>

                {/* Product Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '25px'
                }}>
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((p) => (
                            <div
                                key={p.productId}
                                onClick={() => navigate(`/products/${p.productId}`)}
                                style={{
                                    background: 'white',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 15px rgba(0,0,0,0.08)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    border: '2px solid transparent'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(109, 180, 247, 0.3)';
                                    e.currentTarget.style.borderColor = '#6db4f7';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 15px rgba(0,0,0,0.08)';
                                    e.currentTarget.style.borderColor = 'transparent';
                                }}
                            >
                                {/* Image */}
                                <div style={{
                                    width: '100%',
                                    height: '280px',
                                    overflow: 'hidden',
                                    background: '#f0f0f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
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
                                <div style={{ padding: '20px' }}>
                                    <h3 style={{
                                        fontSize: '1.1rem',
                                        fontWeight: '600',
                                        color: '#333',
                                        marginBottom: '10px',
                                        minHeight: '50px',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {p.name}
                                    </h3>
                                    <p style={{
                                        fontSize: '1.3rem',
                                        fontWeight: '700',
                                        color: '#6db4f7',
                                        marginBottom: '8px'
                                    }}>
                                        {Number(p.price || 0).toLocaleString("vi-VN")} đ
                                    </p>
                                    <p style={{
                                        fontSize: '0.85rem',
                                        color: '#999',
                                        margin: '0'
                                    }}>
                                        SKU: {p.sku}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{
                            gridColumn: '1 / -1',
                            textAlign: 'center',
                            padding: '60px 20px',
                            background: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                        }}>
                            <p style={{
                                fontSize: '1.2rem',
                                color: '#999',
                                margin: '0'
                            }}>
                                {searchText
                                    ? `😔 Không tìm thấy sản phẩm nào cho "${searchText}"`
                                    : "😔 Không có sản phẩm nào"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
