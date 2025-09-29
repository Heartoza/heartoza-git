import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../css/ProductList.css";

export default function ProductList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [priceFilter, setPriceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);

  const searchText = searchParams.get("search") || "";

  // Lấy tất cả category từ API
  useEffect(() => {
    axios
      .get("https://localhost:7109/api/Categories?tree=false")
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.log(err));
  }, []);

  // Load sản phẩm theo category hoặc search
  const fetchProducts = (categoryId = "", search = "") => {
    axios
      .get("https://localhost:7109/api/Products", {
        params: {
          ...(categoryId && { categoryId }),
          ...(search && { q: search }),
        },
      })
      .then((res) => {
        const dataArray = res.data?.items || [];
        setProducts(dataArray);
        applyFilters(priceFilter, dataArray);
      })
      .catch((err) => console.log(err));
  };

  // Load product khi mount hoặc khi search / category thay đổi
  useEffect(() => {
    fetchProducts(categoryFilter, searchText);
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
              <img src={p.imageUrl || "/img/no-image.png"} alt={p.name} className="product-img" />
              <h3>{p.name}</h3>
              <p className="price">{p.price.toLocaleString()} đ</p>
              <p className="sku">SKU: {p.sku}</p>
            </div>
          ))
        ) : (
          <p>{searchText ? `Không có sản phẩm nào cho "${searchText}"` : "Không có sản phẩm nào"}</p>
        )}
      </div>
    </div>
  );
}
