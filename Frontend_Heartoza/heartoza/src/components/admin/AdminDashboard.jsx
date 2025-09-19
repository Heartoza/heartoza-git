import React, { useEffect, useState } from "react";
import { AdminService } from "../../services/adminService";
import "../css/Admin.css";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  let count = 0;

  useEffect(() => {
    (async () => {
      const data = await AdminService.getCategories(true);
      setCategories(data || []);
    })();
  }, []);

  return (
    <div className="admin-page">
      <h2>Quản lý Danh mục</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>STT</th><th>Tên</th><th>Parent</th><th>Số SP</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.categoryId}>
              <td>{count += 1}</td>
              <td>{c.name}</td>
              <td>{c.parentId ?? "—"}</td>
              <td>{c.productCount ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
