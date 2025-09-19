import React, { useEffect, useState } from "react";
import { AdminService } from "../../services/adminService";
import "../css/Admin.css";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await AdminService.getOrders();
      setOrders(data.items || []);
    })();
  }, []);

  return (
    <div className="admin-page">
      <h2>Quản lý Đơn hàng</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th><th>Mã đơn</th><th>User</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày tạo</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.orderId}>
              <td>{o.orderId}</td>
              <td>{o.orderCode}</td>
              <td>{o.userName}</td>
              <td>{o.grandTotal.toLocaleString()} đ</td>
              <td>{o.status}</td>
              <td>{new Date(o.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
