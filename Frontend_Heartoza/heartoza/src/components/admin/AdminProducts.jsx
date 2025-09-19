import React, { useEffect, useState } from "react";
import { AdminService } from "../../services/adminService";
import "../css/Admin.css";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  let count = 0;

  useEffect(() => {
    (async () => {
      const data = await AdminService.getProducts();
      setProducts(data.items || []);
    })();
  }, []);

  return (
    <div className="admin-page">
      <h2>Quản lý Sản phẩm</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>STT</th><th>Tên</th><th>SKU</th><th>Giá</th><th>Danh mục</th><th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.productId}>
              <td>{count += 1}</td>
              <td>{p.name}</td>
              <td>{p.sku}</td>
              <td>{p.price.toLocaleString()} đ</td>
              <td>{p.categoryId}</td>
              <td>{p.isActive ? "✅ Active" : "⛔ Inactive"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
