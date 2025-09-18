import React, { useEffect, useState } from "react";
import axios from "axios";
import "./css/ProductList.css";

// React function component 
// Giúp import component này từ file khác mà không cần ngoặc nhọn
export default function ProductList(){
    // Dùng để tạo biến lưu dữ liệu trong component (state).
// Khi state thay đổi → React tự render lại UI.
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [priceFilter, setPriceFilter] = useState("");
    
    // useEffect: chạy 1 lần khi component load 
    // useEffect(() => {}, []) -> Dùng để chạy 1 đoạn code khi component render.
     useEffect(() => {
    axios
      .get("https://localhost:7109/api/Products")
      .then((res) => {
        console.log("BE trả về:", res.data); // xem dữ liệu trả về từ BE
        // Nếu BE trả object chứa mảng, lấy đúng key:
        const dataArray = res.data?.items || [];
        setProducts(dataArray);
        setFilteredProducts(dataArray);
      })
      .catch((err) => console.log(err));
  }, []);

    const handlePriceFilter = (e) => {
    const value = e.target.value;
    setPriceFilter(value);

    let sorted = [...products]; // clone mảng, tránh mutate state
    if (value === "increament") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (value === "decreament") {
      sorted.sort((a, b) => b.price - a.price);
    }
    setFilteredProducts(sorted);
  };

  return (
    <div className="product-page">
      {/* Filter */}
      <div className="search-filter-group">
        <div className="select-wrapper">
          <i className="bi bi-funnel"></i>
          <select
            className="form-control"
            id="priceFilter"
            name="priceFilter"
            value={priceFilter}
            onChange={handlePriceFilter}
          >
            <option value="" disabled>
              Sắp xếp theo giá
            </option>
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

