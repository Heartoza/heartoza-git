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
    const [selectedCategories, setSelectedCategories] = useState([]);
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
    const fetchProducts = async (categoryIds = [], search = "") => {
        try {
            const res = await http.get("Products", {
                params: {
                    isActive: true,
                    ...(categoryIds.length > 0 && { categoryId: categoryIds[0] }),
                    ...(search && { q: search }),
                },
                validateStatus: (s) => (s >= 200 && s < 300) || s === 204,
            });

            const dataArray = res.status === 204 ? [] : (res.data?.items || []);
            setProducts(dataArray);
            applyFilters(priceFilter, dataArray, categoryIds);
        } catch (err) {
            console.log("Lỗi load products:", err?.message || err);
            setProducts([]);
            setFilteredProducts([]);
        }
    };

    // 🔹 Reload khi category/search đổi
    useEffect(() => {
        fetchProducts(selectedCategories, searchText);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategories, searchText]);

    const handlePriceFilter = (value) => {
        setPriceFilter(value);
        applyFilters(value, products, selectedCategories);
    };

    const handleCategoryToggle = (categoryId) => {
        const newSelected = selectedCategories.includes(categoryId)
            ? selectedCategories.filter(id => id !== categoryId)
            : [categoryId]; // Single selection for now
        setSelectedCategories(newSelected);
    };

    const applyFilters = (priceValue, list, categoryIds) => {
        let result = [...list];
        
        // Filter by categories if any selected
        if (categoryIds && categoryIds.length > 0) {
            result = result.filter(p => categoryIds.includes(p.categoryId));
        }
        
        // Sort by price
        if (priceValue === "increament") result.sort((a, b) => a.price - b.price);
        else if (priceValue === "decreament") result.sort((a, b) => b.price - a.price);
        
        setFilteredProducts(result);
    };

    return (
        <div className="product-list-page">
            <div className="product-list-container">
                {/* Header */}
                {searchText && (
                    <div className="search-result-header">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                        </svg>
                        <h2>Kết quả tìm kiếm: "{searchText}"</h2>
                    </div>
                )}

                <div className="product-content">
                    {/* Sidebar Filter */}
                    <aside className="filter-sidebar">
                        <div className="filter-header">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                            </svg>
                            <h3>Bộ lọc</h3>
                        </div>

                        {/* Price Filter */}
                        <div className="filter-section">
                            <h4 className="filter-title">Sắp xếp theo giá</h4>
                            <div className="filter-options">
                                <label className="filter-checkbox">
                                    <input
                                        type="radio"
                                        name="price"
                                        value=""
                                        checked={priceFilter === ""}
                                        onChange={(e) => handlePriceFilter(e.target.value)}
                                    />
                                    <span className="checkbox-custom"></span>
                                    <span className="checkbox-label">Mặc định</span>
                                </label>
                                <label className="filter-checkbox">
                                    <input
                                        type="radio"
                                        name="price"
                                        value="increament"
                                        checked={priceFilter === "increament"}
                                        onChange={(e) => handlePriceFilter(e.target.value)}
                                    />
                                    <span className="checkbox-custom"></span>
                                    <span className="checkbox-label">Giá thấp đến cao</span>
                                </label>
                                <label className="filter-checkbox">
                                    <input
                                        type="radio"
                                        name="price"
                                        value="decreament"
                                        checked={priceFilter === "decreament"}
                                        onChange={(e) => handlePriceFilter(e.target.value)}
                                    />
                                    <span className="checkbox-custom"></span>
                                    <span className="checkbox-label">Giá cao đến thấp</span>
                                </label>
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="filter-section">
                            <h4 className="filter-title">Danh mục</h4>
                            <div className="filter-options">
                                {categories.map((cat) => (
                                    <label key={cat.categoryId} className="filter-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(cat.categoryId)}
                                            onChange={() => handleCategoryToggle(cat.categoryId)}
                                        />
                                        <span className="checkbox-custom"></span>
                                        <span className="checkbox-label">{cat.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Clear Filters */}
                        {(selectedCategories.length > 0 || priceFilter !== "") && (
                            <button
                                className="clear-filters-btn"
                                onClick={() => {
                                    setSelectedCategories([]);
                                    setPriceFilter("");
                                    applyFilters("", products, []);
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                                Xóa bộ lọc
                            </button>
                        )}
                    </aside>

                    {/* Product Grid */}
                    <div className="product-main">
                        <div className="product-grid">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((p) => (
                                    <div
                                        key={p.productId}
                                        onClick={() => navigate(`/products/${p.productId}`)}
                                        className="product-card"
                                    >
                                        <div className="product-image-wrapper">
                                            <img
                                                src={
                                                    (p.thumbnailUrl && p.thumbnailUrl.trim() !== "")
                                                        ? p.thumbnailUrl
                                                        : (p.imageUrl && p.imageUrl.trim() !== "")
                                                            ? p.imageUrl
                                                            : "/img/no-image.png"
                                                }
                                                alt={p.name}
                                                className="product-image"
                                            />
                                            <div className="product-overlay">
                                                <button className="quick-view-btn">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                        <circle cx="12" cy="12" r="3"/>
                                                    </svg>
                                                    Xem chi tiết
                                                </button>
                                            </div>
                                        </div>

                                        <div className="product-info">
                                            <h3 className="product-name">{p.name}</h3>
                                            <div className="product-meta">
                                                <p className="product-price">
                                                    {Number(p.price || 0).toLocaleString("vi-VN")} đ
                                                </p>
                                            </div>
                                            <button 
                                                className="add-to-cart-card-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const token = localStorage.getItem("token");
                                                    if (!token) {
                                                        alert("Bạn cần đăng nhập trước khi thêm vào giỏ hàng.");
                                                        navigate("/login?reason=add-to-cart");
                                                        return;
                                                    }
                                                    http.post("Cart/AddItem", {
                                                        productId: p.productId,
                                                        quantity: 1,
                                                    })
                                                    .then(() => {
                                                        alert("Đã thêm vào giỏ hàng!");
                                                    })
                                                    .catch((error) => {
                                                        console.error("Lỗi:", error);
                                                        alert("Thêm vào giỏ hàng thất bại.");
                                                    });
                                                }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="9" cy="21" r="1"/>
                                                    <circle cx="20" cy="21" r="1"/>
                                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                                                </svg>
                                                Thêm vào giỏ
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <circle cx="12" cy="12" r="10"/>
                                        <line x1="12" y1="8" x2="12" y2="12"/>
                                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                                    </svg>
                                    <p className="empty-text">
                                        {searchText
                                            ? `Không tìm thấy sản phẩm nào cho "${searchText}"`
                                            : "Không có sản phẩm nào"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
