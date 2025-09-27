import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/ProductList.css";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [priceFilter, setPriceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axios
      .get("https://localhost:7109/api/Products")
      .then((res) => {
        const dataArray = res.data?.items || [];
        setProducts(dataArray);
        setFilteredProducts(dataArray);

        // Lấy danh sách category từ product list
        const uniqueCategories = [...new Set(dataArray.map((p) => p.category))];
        setCategories(uniqueCategories);
      })
      .catch((err) => console.log(err));
  }, []);

  const handlePriceFilter = (e) => {
    const value = e.target.value;
    setPriceFilter(value);
    applyFilters(value, categoryFilter);
  };

  const handleCategoryFilter = (e) => {
    const value = e.target.value;
    setCategoryFilter(value);
    applyFilters(priceFilter, value);
  };

  // Hàm lọc chung
  const applyFilters = (priceValue, categoryValue) => {
    let result = [...products];

    // Lọc theo category
    if (categoryValue) {
      result = result.filter((p) => p.category === categoryValue);
    }

    // Sắp xếp theo giá
    if (priceValue === "increament") {
      result.sort((a, b) => a.price - b.price);
    } else if (priceValue === "decreament") {
      result.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(result);
  };

  return (
    <div className="product-page">
      {/* Filter */}
      <div className="search-filter-group">
        {/* Category filter */}
        <div className="select-wrapper">
          <i className="bi bi-tags"></i>
          <select
            className="form-control"
            id="categoryFilter"
            name="categoryFilter"
            value={categoryFilter}
            onChange={handleCategoryFilter}
          >
            <option value="">Tất cả loại</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Price filter */}
        <div className="select-wrapper">
          <i className="bi bi-funnel"></i>
          <select
            className="form-control"
            id="priceFilter"
            name="priceFilter"
            value={priceFilter}
            onChange={handlePriceFilter}
          >
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
            <div key={p.productId} className="product-card">
              <img
                src={p.imageUrl || "/img/no-image.png"}
                alt={p.name}
                className="product-img"
              />
              <h3>{p.name}</h3>
              <p className="price">{p.price.toLocaleString()} đ</p>
              <p className="sku">SKU: {p.sku}</p>
            </div>
          ))
        ) : (
          <p>Không có sản phẩm nào</p>
        )}
      </div>
    </div>
  );
}
