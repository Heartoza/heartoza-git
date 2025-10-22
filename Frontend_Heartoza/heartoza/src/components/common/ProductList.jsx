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
        if (categoryIds && categoryIds.length > 0) {
            result = result.filter(p => categoryIds.includes(p.categoryId));
        }
        if (priceValue === "increament") result.sort((a, b) => a.price - b.price);
        else if (priceValue === "decreament") result.sort((a, b) => b.price - a.price);
        setFilteredProducts(result);
    };

    return (
        <div className="product-list-page">
            <div className="product-list-container">
                {searchText && (
                    <div className="search-result-header">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <h2>Kết quả tìm kiếm: "{searchText}"</h2>
                    </div>
                )}

                <div className="product-content">
                    {/* Sidebar Filter */}
                    <aside className="filter-sidebar">
                        <div className="filter-header">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
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
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                Xóa bộ lọc
                            </button>
                        )}
                    </aside>

                  {/* Product Grid */}
<div className="product-main">
    <div className="product-grid">
        {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => {
                const outOfStock = Number(p.onHand || 0) <= 0;
                const inactive = !p.isActive;
                const disableAdd = outOfStock || inactive;

                return (
                    <div
                        key={p.productId}
                        className="product-card"
                        onClick={() => navigate(`/products/${p.productId}`)} // 🔹 click vào div cũng đi detail
                    >
                        <div className="product-image-wrapper">
                            <img
                                src={p.thumbnailUrl?.trim() || p.imageUrl?.trim() || "/img/no-image.png"}
                                alt={p.name}
                                className="product-image"
                            />
                            <div className="product-overlay">
                                <button
                                    className="quick-view-btn"
                                    onClick={(e) => {
                                        e.stopPropagation(); // 🔹 tránh click trùng với div
                                        navigate(`/products/${p.productId}`);
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    Xem chi tiết
                                </button>
                            </div>
                        </div>

                        <div className="product-info">
                            <h3 className="product-name">{p.name}</h3>
                            <p className="product-price">{Number(p.price || 0).toLocaleString("vi-VN")} đ</p>

                            <button
                                className={`add-to-cart-btn ${disableAdd ? "disabled" : ""}`}
                                disabled={disableAdd}
                                title={
                                    disableAdd
                                        ? inactive
                                            ? "Sản phẩm ngừng bán"
                                            : "Sản phẩm đã hết hàng"
                                        : "Thêm vào giỏ hàng"
                                }
                                onClick={async (e) => {
                                    e.stopPropagation(); // 🔹 tránh navigate khi click nút
                                    const token = localStorage.getItem("token");
                                    if (!token) {
                                        alert("Bạn cần đăng nhập trước khi thêm vào giỏ hàng.");
                                        navigate("/login?reason=add-to-cart");
                                        return;
                                    }

                                    try {
                                        await http.post("Cart/AddItem", {
                                            productId: p.productId,
                                            quantity: 1,
                                        });
                                        alert("Đã thêm vào giỏ hàng thành công!");
                                         localStorage.setItem("recentAddedProduct", p.productId);
                                        navigate("/cart");
                                    } catch (err) {
                                        console.error("Thêm vào giỏ thất bại:", err);
                                        alert("Thêm vào giỏ hàng thất bại.");
                                    }
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="9" cy="21" r="1" />
                                    <circle cx="20" cy="21" r="1" />
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                </svg>
                                {disableAdd ? "Không thể thêm" : "Thêm vào giỏ"}
                            </button>

                            {disableAdd && (
                                <div className="warning-message">
                                    {inactive ? "Sản phẩm ngừng bán" : "Sản phẩm đã hết hàng"}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })
        ) : (
            <div className="empty-state">
                <p>{searchText ? `Không tìm thấy sản phẩm cho "${searchText}"` : "Không có sản phẩm nào"}</p>
            </div>
        )}
    </div>
</div>

                </div>
            </div>
        </div>
    );
}
