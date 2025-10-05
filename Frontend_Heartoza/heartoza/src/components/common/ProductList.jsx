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
        <div className="product-page">
            {/* Filter */}
            <div className="search-filter-group">
                <div className="select-wrapper">
                    <i className="bi bi-tags"></i>
                    <select
                        value={categoryFilter}
                        onChange={handleCategoryFilter}
                        className="form-control"
                    >
                        <option value="">Tất cả loại</option>
                        {categories.map((cat) => (
                            <option key={cat.categoryId} value={cat.categoryId}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="select-wrapper">
                    <i className="bi bi-funnel"></i>
                    <select value={priceFilter} onChange={handlePriceFilter} className="form-control">
                        <option value="">Sắp xếp theo giá</option>
                        <option value="increament">Giá từ thấp đến cao</option>
                        <option value="decreament">Giá từ cao đến thấp</option>
                    </select>
                </div>
            </div>

            {/* Product grid */}
            <div className="product-grid">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => (
                        <div
                            key={p.productId}
                            className="product-card"
                            onClick={() => navigate(`/products/${p.productId}`)}
                            style={{ cursor: "pointer" }}
                        >
                            <img
                                src={p.imageUrl && p.imageUrl.trim() !== "" ? p.imageUrl : "/img/no-image.png"}
                                alt={p.name}
                                className="product-img"
                            />

                            <h3>{p.name}</h3>
                            <p className="price">{Number(p.price || 0).toLocaleString("vi-VN")} đ</p>
                            <p className="sku">SKU: {p.sku}</p>
                        </div>
                    ))
                ) : (
                    <p>
                        {searchText
                            ? `Không có sản phẩm nào cho "${searchText}"`
                            : "Không có sản phẩm nào"}
                    </p>
                )}
            </div>
        </div>
    );
}
