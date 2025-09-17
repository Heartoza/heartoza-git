import React, { useEffect, useState } from "react";
import axios from "axios";

// React function component 
// Giúp import component này từ file khác mà không cần ngoặc nhọn
export default function ProductList(){
    // Dùng để tạo biến lưu dữ liệu trong component (state).
// Khi state thay đổi → React tự render lại UI.
    const [products, setProducts] = useState([]);

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
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="search-filter-group">
        <div className="search-input-wrapper">
            <i className="bi bi-search"></i>
            <input type="text" id="searchInput" name="keyword" placeholder="Tìm theo tên dịch vụ" />
        </div>
        
        <div className="select-wrapper">
            <i className="bi bi-funnel"></i>
            <select className="form-control" id="ageLimit" name="ageLimit">
                <option value="" disabled selected>Chọn độ tuổi</option>
                <c:forEach var="ageLimit" items="${ageLimits}">
                    <option value="${ageLimit.ageLimitID}"></option>
                </c:forEach>
            </select>
        </div>
        
        <div className="select-wrapper">
            <i className="bi bi-funnel"></i>
            <select className="form-control" id="priceFilter" name="priceFilter">
                <option value="" disabled selected>Sắp xếp theo giá</option>
                <option value="lowToHigh">Giá từ thấp đến cao</option>
                <option value="highToLow">Giá từ cao đến thấp</option>
            </select>
        </div>
        
        <button type="submit" class="search-btn">
            <i className="bi bi-search"></i>
        </button>
    </div>
  );
}

