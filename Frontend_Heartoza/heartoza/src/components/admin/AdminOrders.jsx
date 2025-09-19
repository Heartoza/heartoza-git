import React, { useEffect, useState } from "react";
import { AdminService } from "../../services/adminService";
import "../css/Admin.css";
import { NavLink } from "react-router-dom";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  let count = 0;

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
            <th>STT</th><th>Mã đơn</th><th>User</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày tạo</th><th>Chi tiết</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.orderId}>
              <td>{count += 1}</td>
              <td>{o.orderCode}</td>
              <td>{o.userName}</td>
              <td>{o.grandTotal.toLocaleString()} đ</td>
              <td>{o.status}</td>
              <td>{new Date(o.createdAt).toLocaleString()}</td>
              <td>
                <NavLink to={`/admin/orders/${o.orderId}`}>Chi tiết</NavLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
