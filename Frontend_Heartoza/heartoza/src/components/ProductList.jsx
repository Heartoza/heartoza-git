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
    <div>
      <h2 className="title">Danh sách sản phẩm</h2>
      <ul>
        {Array.isArray(products) && products.map((p) => (
          <li key={p.productId}>
            {p.name} - {p.price}
          </li>
        ))}
      </ul>
    </div>
  );
}

