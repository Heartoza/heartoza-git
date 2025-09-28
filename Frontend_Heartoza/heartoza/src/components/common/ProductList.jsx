import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../css/ProductList.css";
import { Link } from "react-router-dom";

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [priceFilter, setPriceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);

  // Lấy tất cả category từ API riêng
  useEffect(() => {
    axios
      .get("https://localhost:7109/api/Categories?tree=false")
      .then((res) => {
        setCategories(res.data || []);
      })
      .catch((err) => console.log(err));
  }, []);

  // Hàm load product từ API (kèm categoryId nếu có)
  const fetchProducts = (categoryId = "") => {
    axios
      .get("https://localhost:7109/api/Products", {
        params: categoryId ? { categoryId } : {},
      })
      .then((res) => {
        const dataArray = res.data?.items || [];
        setProducts(dataArray);
        applyFilters(priceFilter, dataArray); // sort nếu cần
      })
      .catch((err) => console.log(err));
  };

  // Load all product ban đầu
  useEffect(() => {
    fetchProducts();
  }, []);

  const handlePriceFilter = (e) => {
    const value = e.target.value;
    setPriceFilter(value);
    applyFilters(value, products);
  };

  const handleCategoryFilter = (e) => {
    const value = e.target.value;
    setCategoryFilter(value);
    fetchProducts(value); // gọi API lại với categoryId
  };

  // Sort/filter theo giá
  const applyFilters = (priceValue, list) => {
    let result = [...list];

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
            {categories.map((cat) => (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.name}
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
            <div
              key={p.productId}
              className="product-card"
              onClick={() => navigate(`/products/${p.productId}`)} // navigate tới ProductDetail
              style={{ cursor: "pointer" }} // hiện con trỏ tay khi hover
            >
              <img
                src={p.imageUrl || "/img/no-image.png"}
                alt={p.name}
                className="product-img"
              />
              <h3>{p.name}</h3>
              <p className="price">{p.price.toLocaleString()} đ</p>
              <p className="sku">SKU: {p.sku}</p>
               <Link to={`/product/${p.productId}`} className="btn-detail">
                                Xem chi tiết
               </Link>
            </div>
          ))
        ) : (
          <p>Không có sản phẩm nào</p>
        )}
      </div>
    </div>
  );
}
