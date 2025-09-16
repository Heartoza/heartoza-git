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
        axios.get("https://localhost:7109/api/Products")
            .then(res => {
            console.log(res.data);
            setProducts(res.data); // <== Quan trọng
            })
            .catch(err => console.log(err));
    }, []);


    // trả về giao diện
    return(
        <div>
            <h2>Danh sách sảm phẩm</h2>
            <ul>
                {products.map(p => {
                    return (
                    <li key={p.ProductId}>
                        {p.Name} - {p.Price}
                    </li>
                    )
                })}
            </ul>
        </div>
    );
}

