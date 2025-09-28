import React, { useEffect, useState } from "react";
import { useParams, NavLink } from "react-router-dom";
import { AdminService } from "../../services/adminService";

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await AdminService.getOrderById(id);
        setOrder(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="admin-page">Đang tải...</div>;
  if (!order) return <div className="admin-page">Không tìm thấy đơn hàng</div>;

  return (
    <div className="admin-page">
      <h2>Chi tiết đơn hàng - {order.orderCode}</h2>
      <NavLink to="/admin/orders" className="back-link">← Quay lại</NavLink>

      {/* Thông tin chung */}
      <div className="card">
        <h3>Thông tin chung</h3>
        <p><strong>Khách hàng:</strong> {order.user?.fullName}</p>
        <p><strong>Địa chỉ giao hàng:</strong> {order.shippingAddress.fullAddress}</p>
        <p><strong>Trạng thái:</strong> {order.status}</p>
        <p><strong>Ngày tạo:</strong> {new Date(order.createdAt).toLocaleString()}</p>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="card">
        <h3>Sản phẩm</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th className="text-right">Đơn giá</th>
              <th className="text-center">Số lượng</th>
              <th className="text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.orderItems?.map((item) => (
              <tr key={item.orderItemId}>
                <td>{item.product?.name}</td>
                <td className="text-right">{item.unitPrice.toLocaleString()} đ</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-right">{item.lineTotal?.toLocaleString()} đ</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tổng kết */}
      <div className="card">
        <h3>Tổng cộng</h3>
        <p><strong>Tạm tính:</strong> {order.subtotal.toLocaleString()} đ</p>
        <p><strong>Phí ship:</strong> {order.shippingFee?.toLocaleString() ?? "0"} đ</p>
        <p className="grand-total">
          <strong>Tổng thanh toán:</strong> {order.grandTotal.toLocaleString()} đ
        </p>
      </div>
    </div>
  );
}
